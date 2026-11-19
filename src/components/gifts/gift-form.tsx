import { router, usePreventRemove } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { GiftCategoriesSheet } from '@/components/gifts/gift-categories-sheet';
import { giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, Chip, FormField, Icon, Screen, Section, SegmentedControl, SwitchRow } from '@/components/ui';
import { giftCategoryHint, OTHER_GIFT_CATEGORY_ID } from '@/constants/gift-categories';
import { MinTouchTarget, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useReceivedGifts } from '@/hooks/use-received-gifts';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { GiftCategory, GiftDraft, ReceivedGift } from '@/types/gift';
import { confirmAction, confirmDelete, notify } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/haptics';
import { allGiftCategories, GIFT_LIMITS, normalizeGiver, recentGivers, validateGiftForm } from '@/utils/gifts';

type GiftFormProps = {
  /** The gift being edited; leave out to add a new one. */
  initial?: ReceivedGift;
  /** For a new gift: the category to start on, such as one picked from the empty page. */
  startCategoryId?: string;
  submitLabel: string;
  /** Saves the draft. The form goes back by itself once this resolves. */
  onSubmit: (draft: GiftDraft) => Promise<void>;
  /**
   * Deletes the gift. Runs after the form has already gone back, so the screen
   * never flashes "this gift is gone"; it should show its own undo or error.
   */
  onDelete?: () => Promise<void>;
};

type Certainty = 'exact' | 'estimate';
type Span = 'day' | 'period';

const DEFAULT_CATEGORY_ID = 'gift';

/**
 * Add Gift and Edit Gift share this form, so both ask the same questions in
 * the same order: what kind, how much, who and what, when, then gratitude.
 *
 * - The category comes first, because it changes the words below it (a
 *   discount asks for a "Discount amount" from "Aarong, Daraz").
 * - A single tap answers yes/no questions; nothing hides behind a switch
 *   that then reveals another field.
 * - Leaving with unsaved changes asks first, so a swipe never loses a memory.
 */
export function GiftForm({ initial, startCategoryId, submitLabel, onSubmit, onDelete }: GiftFormProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const { country } = usePreferences();
  const { gifts, categories, addCategory, renameCategory, deleteCategory } = useReceivedGifts();
  const allCategories = useMemo(() => allGiftCategories(categories), [categories]);

  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? startCategoryId ?? DEFAULT_CATEGORY_ID);
  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '');
  const [certainty, setCertainty] = useState<Certainty>(initial?.isEstimate ? 'estimate' : 'exact');
  const [giver, setGiver] = useState(initial?.giver ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [span, setSpan] = useState<Span>(initial?.endDate ? 'period' : 'day');
  const [date, setDate] = useState(() => (initial ? new Date(initial.date) : new Date()));
  const [endDate, setEndDate] = useState(() => (initial?.endDate ? new Date(initial.endDate) : new Date()));
  const [thanked, setThanked] = useState(initial?.thanked ?? false);
  const [gratitudeNote, setGratitudeNote] = useState(initial?.gratitudeNote ?? '');

  const [amountError, setAmountError] = useState('');
  const [periodError, setPeriodError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  /** Set once the form may leave: after a save, a discard or a delete. */
  const [exit, setExit] = useState<(() => void) | null>(null);

  const amountRef = useRef<ComponentRef<typeof TextInput>>(null);
  const noteRef = useRef<ComponentRef<typeof TextInput>>(null);

  // A gift whose category was deleted reads as Other.
  const selectedCategoryId = allCategories.some((category) => category.id === categoryId)
    ? categoryId
    : OTHER_GIFT_CATEGORY_ID;
  const hint = giftCategoryHint(selectedCategoryId);
  const coversPeriod = span === 'period';
  const givers = recentGivers(gifts).filter(
    (name) => name.toLocaleLowerCase() !== normalizeGiver(giver).toLocaleLowerCase(),
  );

  const draft: GiftDraft = {
    amount: Number(amountText),
    isEstimate: certainty === 'estimate',
    categoryId: selectedCategoryId,
    giver: normalizeGiver(giver).slice(0, GIFT_LIMITS.giver),
    date: date.toISOString(),
    endDate: coversPeriod ? endDate.toISOString() : null,
    note: note.trim().slice(0, GIFT_LIMITS.note),
    thanked,
    gratitudeNote: gratitudeNote.trim().slice(0, GIFT_LIMITS.gratitudeNote),
  };
  // What the form held when it opened, to tell whether anything changed.
  const [startingPoint] = useState(() => JSON.stringify(draft));
  const dirty = JSON.stringify(draft) !== startingPoint;

  usePreventRemove(dirty && exit === null, ({ repeat }) => {
    confirmAction(
      initial ? 'Discard your changes?' : 'Discard this gift?',
      initial ? 'Your edits to this gift have not been saved.' : 'What you have typed will not be saved.',
      () => setExit(() => repeat),
      'Discard',
    );
  });

  useEffect(() => {
    exit?.();
  }, [exit]);

  const submit = async () => {
    if (saving) return;
    const problem = validateGiftForm({ amountText, date, coversPeriod, endDate });
    if (problem) {
      if (problem.field === 'period') setPeriodError(problem.message);
      else {
        setAmountError(problem.message);
        amountRef.current?.focus();
      }
      return;
    }
    setSaving(true);
    try {
      await onSubmit(draft);
      setExit(() => () => router.back());
    } catch {
      notify('Could not save', 'The gift could not be saved. Please try again.');
      setSaving(false);
    }
  };

  const askDelete = () => {
    if (!onDelete) return;
    confirmDelete('Delete this gift?', 'You can undo this straight after.', () => {
      setExit(() => () => {
        router.back();
        void onDelete();
      });
    });
  };

  const pickCategory = (category: GiftCategory) => {
    triggerHaptic();
    setCategoryId(category.id);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <Section title="What did you receive?" subtitle="Something someone else paid for, so you did not have to.">
          <View accessibilityRole="radiogroup" accessibilityLabel="Category" style={styles.grid}>
            {allCategories.map((category) => {
              const selected = selectedCategoryId === category.id;
              const hue = giftHueColor(category.hue);
              return (
                <Pressable
                  key={category.id}
                  onPress={() => pickCategory(category)}
                  accessibilityRole="radio"
                  accessibilityLabel={category.name}
                  accessibilityState={{ checked: selected }}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      backgroundColor: selected ? withAlpha(hue, isDark ? 0.22 : 0.12) : theme.cardMuted,
                      borderColor: selected ? hue : theme.border,
                    },
                    selected && styles.tileSelected,
                    pressed && PressFeedback,
                  ]}>
                  <View style={[styles.tileBadge, { backgroundColor: withAlpha(hue, isDark ? 0.2 : 0.14) }]}>
                    <Icon name={giftGlyph(category.icon)} size="md" color={hue} />
                  </View>
                  <ThemedText type="smallBold" numberOfLines={2} style={styles.flex}>
                    {category.name}
                  </ThemedText>
                  {selected ? <Icon name="check" size="sm" color={hue} /> : null}
                </Pressable>
              );
            })}
            <Pressable
              onPress={() => setSheetOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Make a new category"
              style={({ pressed }) => [styles.tile, styles.newTile, { borderColor: theme.border }, pressed && PressFeedback]}>
              <View style={[styles.tileBadge, { backgroundColor: theme.accentMuted }]}>
                <Icon name="tag-plus-outline" size="md" color={theme.accent} />
              </View>
              <ThemedText type="smallBold" numberOfLines={2} style={[styles.flex, { color: theme.accent }]}>
                New category
              </ThemedText>
            </Pressable>
          </View>
        </Section>

        <Section title="How much">
          <AmountField
            label={hint.valueLabel}
            value={amountText}
            onChangeText={(value) => {
              setAmountText(value);
              setAmountError('');
            }}
            symbol={country.symbol.trim()}
            helper={hint.valueHelper}
            error={amountError || undefined}
            inputRef={amountRef}
          />
          <SegmentedControl
            label="Is the amount exact?"
            value={certainty}
            onChange={(value) => {
              triggerHaptic();
              setCertainty(value);
            }}
            options={[
              { value: 'exact', label: 'Exact' },
              { value: 'estimate', label: 'Best guess' },
            ]}
          />
          <ThemedText type="caption" themeColor="textSecondary">
            {certainty === 'estimate'
              ? 'It will show with ≈, so you remember it is a guess. A guess is fine.'
              : 'Not sure? Choose Best guess. Years of school fees or a meal do not need an exact figure.'}
          </ThemedText>
        </Section>

        <Section title="From whom, and what">
          <View style={styles.field}>
            <FormField
              label="From whom"
              value={giver}
              onChangeText={setGiver}
              placeholder={hint.giverPlaceholder}
              helper="Optional"
              autoCapitalize="words"
              maxLength={GIFT_LIMITS.giver}
              returnKeyType="next"
              onSubmitEditing={() => noteRef.current?.focus()}
            />
            {givers.length > 0 ? (
              <View style={styles.chips} accessibilityLabel="Recent people">
                {givers.map((name) => (
                  <Chip key={name} label={name} accessibilityLabel={`From ${name}`} onPress={() => setGiver(name)} />
                ))}
              </View>
            ) : null}
          </View>
          <FormField
            label="What was it"
            value={note}
            onChangeText={setNote}
            placeholder={hint.notePlaceholder}
            helper="Optional"
            maxLength={GIFT_LIMITS.note}
            returnKeyType="done"
            inputRef={noteRef}
          />
        </Section>

        <Section title="When">
          <SegmentedControl
            label="When was it"
            value={span}
            onChange={(value) => {
              triggerHaptic();
              setSpan(value);
              setPeriodError('');
            }}
            options={[
              { value: 'day', label: 'On one day' },
              { value: 'period', label: 'Over a period' },
            ]}
          />
          <View style={styles.field}>
            <ThemedText type="smallBold">{coversPeriod ? 'From' : 'Date'}</ThemedText>
            <DatePicker value={date} onChange={setDate} label={coversPeriod ? 'Start date' : 'Date'} />
          </View>
          {coversPeriod ? (
            <View style={styles.field}>
              <ThemedText type="smallBold">To</ThemedText>
              <DatePicker
                value={endDate}
                onChange={(value) => {
                  setEndDate(value);
                  setPeriodError('');
                }}
                label="End date"
              />
              {periodError ? (
                <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
                  {periodError}
                </ThemedText>
              ) : (
                <ThemedText type="caption" themeColor="textSecondary">
                  For something that lasted, like years of school fees.
                </ThemedText>
              )}
            </View>
          ) : null}
        </Section>

        <Section title="Gratitude" subtitle="The reason this page exists. Take a moment with it.">
          <Card padded={false}>
            <SwitchRow
              label="I have thanked them"
              description={thanked ? 'Lovely. It shows on the gift.' : 'Tick this once you have said thank you.'}
              value={thanked}
              onValueChange={(value) => {
                triggerHaptic();
                setThanked(value);
              }}
            />
            <CardDivider />
            <View style={styles.cardField}>
              <FormField
                label="Why I am grateful"
                value={gratitudeNote}
                onChangeText={setGratitudeNote}
                placeholder="What it meant to you, in your own words"
                helper="Optional. Reading it later is part of the point."
                maxLength={GIFT_LIMITS.gratitudeNote}
                multiline
              />
            </View>
          </Card>
        </Section>

        <View style={styles.actions}>
          <Button label={submitLabel} onPress={() => void submit()} loading={saving} />
          <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        </View>

        {onDelete ? (
          <View style={[styles.danger, { borderTopColor: theme.border }]}>
            <Button label="Delete gift" variant="danger" onPress={askDelete} />
          </View>
        ) : null}
      </Screen>

      <GiftCategoriesSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        gifts={gifts}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
        onCreated={(category) => setCategoryId(category.id)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Two per row, so every name fits on narrow phones (wrapping to two lines if it must).
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  // A heavier edge on the chosen tile, so the choice does not rest on colour alone.
  tileSelected: {
    borderWidth: 2,
    paddingHorizontal: Spacing.two - (2 - StyleSheet.hairlineWidth),
    paddingVertical: Spacing.two - (2 - StyleSheet.hairlineWidth),
  },
  newTile: { borderStyle: 'dashed', borderWidth: 1 },
  tileBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardField: { padding: Spacing.three },
  actions: { gap: Spacing.two },
  danger: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three },
});
