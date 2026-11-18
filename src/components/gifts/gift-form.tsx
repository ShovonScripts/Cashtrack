import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { GiftCategoriesSheet } from '@/components/gifts/gift-categories-sheet';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, Chip, FormField, Screen, SwitchRow } from '@/components/ui';
import { OTHER_GIFT_CATEGORY_ID } from '@/constants/gift-categories';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useReceivedGifts } from '@/hooks/use-received-gifts';
import type { GiftDraft, ReceivedGift } from '@/types/gift';
import { sanitizeAmountInput } from '@/utils/amount-input';
import { notify } from '@/utils/confirm';
import { allGiftCategories, GIFT_LIMITS, normalizeGiver, recentGivers, validateGiftForm } from '@/utils/gifts';

type GiftFormProps = {
  /** The gift being edited; leave out to add a new one. */
  initial?: ReceivedGift;
  submitLabel: string;
  onSubmit: (draft: GiftDraft) => Promise<void>;
  onDelete?: () => void;
};

const DEFAULT_CATEGORY_ID = 'gift';

/** Shared by Add Gift and Edit Gift, so both always ask the same questions. */
export function GiftForm({ initial, submitLabel, onSubmit, onDelete }: GiftFormProps) {
  const { country } = usePreferences();
  const { gifts, categories, addCategory, renameCategory, deleteCategory } = useReceivedGifts();
  const allCategories = useMemo(() => allGiftCategories(categories), [categories]);

  const [amountText, setAmountText] = useState(initial ? String(initial.amount) : '');
  const [isEstimate, setIsEstimate] = useState(initial?.isEstimate ?? false);
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? DEFAULT_CATEGORY_ID);
  const [giver, setGiver] = useState(initial?.giver ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [date, setDate] = useState(() => (initial ? new Date(initial.date) : new Date()));
  const [coversPeriod, setCoversPeriod] = useState(Boolean(initial?.endDate));
  const [endDate, setEndDate] = useState(() => (initial?.endDate ? new Date(initial.endDate) : new Date()));
  const [thanked, setThanked] = useState(initial?.thanked ?? false);
  const [gratitudeNote, setGratitudeNote] = useState(initial?.gratitudeNote ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // A gift whose category was deleted reads as Other.
  const selectedCategoryId = allCategories.some((category) => category.id === categoryId)
    ? categoryId
    : OTHER_GIFT_CATEGORY_ID;
  const givers = recentGivers(gifts).filter((name) => name.toLocaleLowerCase() !== normalizeGiver(giver).toLocaleLowerCase());

  const submit = async () => {
    if (saving) return;
    const problem = validateGiftForm({ amountText, date, coversPeriod, endDate });
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        amount: Number(amountText),
        isEstimate,
        categoryId: selectedCategoryId,
        giver: normalizeGiver(giver).slice(0, GIFT_LIMITS.giver),
        date: date.toISOString(),
        endDate: coversPeriod ? endDate.toISOString() : null,
        note: note.trim().slice(0, GIFT_LIMITS.note),
        thanked,
        gratitudeNote: gratitudeNote.trim().slice(0, GIFT_LIMITS.gratitudeNote),
      });
    } catch {
      notify('Could not save', 'The gift could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <AmountField
          label="Value"
          value={amountText}
          onChangeText={(value) => {
            setAmountText(sanitizeAmountInput(value));
            setError('');
          }}
          symbol={country.symbol.trim()}
          helper="What it cost whoever paid. A best guess is fine."
        />

        <Card padded={false}>
          <SwitchRow
            label="This is an estimate"
            description="Shown with ≈, so you remember it is a guess."
            value={isEstimate}
            onValueChange={setIsEstimate}
          />
        </Card>

        <View style={styles.field}>
          <ThemedText type="smallBold">Category</ThemedText>
          <View style={styles.chips}>
            {allCategories.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={selectedCategoryId === category.id}
                onPress={() => setCategoryId(category.id)}
              />
            ))}
            <Chip label="+ New category" accessibilityLabel="Make a new category" onPress={() => setSheetOpen(true)} />
          </View>
        </View>

        <View style={styles.field}>
          <FormField
            label="From whom"
            value={giver}
            onChangeText={setGiver}
            placeholder="e.g. Abbu, Office, Daraz"
            helper="Optional"
            autoCapitalize="words"
            maxLength={GIFT_LIMITS.giver}
          />
          {givers.length > 0 ? (
            <View style={styles.chips}>
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
          placeholder="e.g. School fees until SSC"
          helper="Optional"
          maxLength={GIFT_LIMITS.note}
        />

        <View style={styles.field}>
          <ThemedText type="smallBold">{coversPeriod ? 'From' : 'Date'}</ThemedText>
          <DatePicker value={date} onChange={setDate} label={coversPeriod ? 'Start date' : 'Date'} />
        </View>

        <Card padded={false}>
          <SwitchRow
            label="It covered a period"
            description="For something that lasted, like years of school fees."
            value={coversPeriod}
            onValueChange={(value) => {
              setCoversPeriod(value);
              setError('');
            }}
          />
        </Card>

        {coversPeriod ? (
          <View style={styles.field}>
            <ThemedText type="smallBold">To</ThemedText>
            <DatePicker value={endDate} onChange={setEndDate} label="End date" />
          </View>
        ) : null}

        <ThemedText type="subtitle" accessibilityRole="header">
          Gratitude
        </ThemedText>
        <Card padded={false}>
          <SwitchRow label="I have thanked them" value={thanked} onValueChange={setThanked} />
          <CardDivider />
          <View style={styles.cardField}>
            <FormField
              label="Why I am grateful"
              value={gratitudeNote}
              onChangeText={setGratitudeNote}
              placeholder="What this meant to you"
              helper="Optional"
              maxLength={GIFT_LIMITS.gratitudeNote}
              multiline
            />
          </View>
        </Card>

        {error ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        <Button label={submitLabel} onPress={() => void submit()} loading={saving} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
        {onDelete ? <Button label="Delete gift" variant="danger" onPress={onDelete} /> : null}
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
  cardField: { padding: Spacing.three },
});
