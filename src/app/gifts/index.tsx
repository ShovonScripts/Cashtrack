import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GiftCategoriesSheet } from '@/components/gifts/gift-categories-sheet';
import { GiftCategoryTotals, GiftGiverTotals, plural } from '@/components/gifts/gift-insights';
import { GiftRememberCard } from '@/components/gifts/gift-remember-card';
import { GiftRow } from '@/components/gifts/gift-row';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import {
  Badge,
  Button,
  Chip,
  HeroCard,
  IconButton,
  Screen,
  SearchField,
  Section,
  SegmentedControl,
  SkeletonList,
  StatStrip,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useToast } from '@/context/toast-context';
import { reloadReceivedGifts, useReceivedGifts } from '@/hooks/use-received-gifts';
import type { ReceivedGift } from '@/types/gift';
import { notify } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/haptics';
import { triggerNotificationHaptic } from '@/utils/motion';
import {
  filterGifts,
  groupGiftsByYear,
  isGiftFilterActive,
  NO_GIFT_FILTER,
  pickGiftToRemember,
  resolveGiftCategory,
  summarizeGifts,
  totalsByCategory,
  totalsByGiver,
  type GiftFilter,
} from '@/utils/gifts';

type GiftsView = 'gifts' | 'categories' | 'people';

/** Below this many gifts, a search box is more clutter than help. */
const SEARCH_FROM = 6;
/** A daily look-back needs a few gifts to rotate through. */
const REMEMBER_FROM = 3;

/** Ways in from the empty page: each opens the form on that category. */
const STARTERS: readonly { label: string; categoryId: string }[] = [
  { label: 'School fees', categoryId: 'education' },
  { label: 'A dawat', categoryId: 'food' },
  { label: 'A present', categoryId: 'gift' },
  { label: "A doctor's bill", categoryId: 'health' },
  { label: 'A trip', categoryId: 'travel' },
  { label: 'A discount', categoryId: 'discount' },
];

/**
 * Gifts Received: everything others have paid for you, kept apart from your
 * own money.
 *
 * The total comes first because it is the point of the page — a reason to be
 * thankful — with how many gifts you have said thank you for beside it. Below,
 * one control switches between the gifts themselves, where they came from, and
 * who gave them; tapping a category or a person opens their gifts.
 */
export default function GiftsScreen() {
  const { formatAmount } = usePreferences();
  const { status, gifts, categories, setThanked, addCategory, renameCategory, deleteCategory } = useReceivedGifts();
  const toast = useToast();
  const [view, setView] = useState<GiftsView>('gifts');
  const [filter, setFilter] = useState<GiftFilter>(NO_GIFT_FILTER);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const summary = useMemo(() => summarizeGifts(gifts), [gifts]);
  const byCategory = useMemo(() => totalsByCategory(gifts, categories), [gifts, categories]);
  const byGiver = useMemo(() => totalsByGiver(gifts), [gifts]);
  const visible = useMemo(() => filterGifts(gifts, filter, categories), [gifts, filter, categories]);
  const years = useMemo(() => groupGiftsByYear(visible), [visible]);

  const thanked = summary.count - summary.notThanked;
  const unnamed = gifts.filter((gift) => gift.giver.trim() === '').length;
  const filtering = isGiftFilterActive(filter);
  const topGiver = byGiver[0];
  const toRemember = gifts.length >= REMEMBER_FROM && !filtering ? pickGiftToRemember(gifts) : null;

  const addGift = (categoryId?: string) => {
    triggerHaptic();
    router.push(categoryId ? { pathname: '/gifts/add', params: { category: categoryId } } : '/gifts/add');
  };

  const openGift = (gift: ReceivedGift) => router.push({ pathname: '/gifts/[id]', params: { id: gift.id } });

  /** The heart on a row: a small celebration when you mark it, a quiet undo either way. */
  const toggleThanked = async (gift: ReceivedGift) => {
    const next = !gift.thanked;
    if (next) triggerNotificationHaptic();
    else triggerHaptic();
    try {
      await setThanked(gift.id, next);
      toast.show({
        message: next
          ? gift.giver
            ? `Thanked ${gift.giver}. That matters.`
            : 'Marked as thanked. That matters.'
          : 'Thank-you mark taken off',
        actionLabel: 'Undo',
        onAction: () => {
          setThanked(gift.id, !next).catch(() => notify('Could not undo', 'The change could not be undone.'));
        },
      });
    } catch {
      notify('Could not save', 'The thank-you mark could not be saved. Please try again.');
    }
  };

  const switchView = (next: GiftsView) => {
    triggerHaptic();
    setView(next);
  };

  /** From Categories or People: show the gifts behind the row just tapped. */
  const openGifts = (next: Partial<GiftFilter>) => {
    triggerHaptic();
    setFilter({ ...NO_GIFT_FILTER, ...next });
    setView('gifts');
  };

  const toggleChip = (next: Partial<GiftFilter>) => {
    triggerHaptic();
    setFilter((current) => ({ ...current, ...next }));
  };

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => <IconButton icon="add" label="Add a gift" onPress={() => addGift()} />,
      }}
    />
  );

  if (status === 'idle' || status === 'loading') {
    return (
      <Screen topInset={false}>
        {header}
        <SkeletonList rows={3} label="Loading your gifts" />
      </Screen>
    );
  }

  if (status === 'error') {
    return (
      <Screen topInset={false}>
        {header}
        <Card>
          <LoadErrorState
            title="Couldn't load your gifts"
            message="Your gifts couldn't be read just now. Nothing has been deleted."
            isRetrying={retrying}
            onRetry={async () => {
              setRetrying(true);
              await reloadReceivedGifts();
              setRetrying(false);
            }}
          />
        </Card>
      </Screen>
    );
  }

  if (gifts.length === 0) {
    return (
      <Screen topInset={false}>
        {header}
        <Card>
          <EmptyState
            icon="gift-outline"
            title="Nothing recorded yet"
            message="Write down what others have paid for you: a present, school fees your parents covered, a meal at an invitation, a doctor's bill someone settled, or a shop's discount. Seeing it all in one place is a reason to be thankful."
            actionLabel="Add your first gift"
            onAction={() => addGift()}
          />
        </Card>
        <Section title="Or start with one of these" subtitle="Each opens the form ready for that kind of gift.">
          <View style={styles.starters}>
            {STARTERS.map((starter) => (
              <Chip
                key={starter.categoryId}
                label={starter.label}
                accessibilityLabel={`Add ${starter.label.toLocaleLowerCase()}`}
                onPress={() => addGift(starter.categoryId)}
              />
            ))}
          </View>
        </Section>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.centered}>
          Gifts never touch your balance, income, expenses or reports.
        </ThemedText>
      </Screen>
    );
  }

  return (
    <Screen topInset={false}>
      {header}

      <HeroCard
        eyebrow="RECEIVED FROM OTHERS"
        value={`${summary.hasEstimates ? '≈ ' : ''}${formatAmount(summary.lifetime)}`}
        caption={
          topGiver
            ? `The most came from ${topGiver.giver}. Take a moment to be thankful.`
            : 'Everything others have paid for you. Take a moment to be thankful.'
        }
        footer={
          <>
            <Badge
              label={thanked === summary.count ? 'Thanked for every gift' : `Thanked for ${thanked} of ${summary.count}`}
              tone="success"
              icon="hand-heart-outline"
            />
            {summary.hasEstimates ? <Badge label="≈ includes best guesses" tone="neutral" /> : null}
          </>
        }
      />

      <StatStrip
        items={[
          { label: 'This year', value: formatAmount(summary.thisYear) },
          { label: 'People', value: String(summary.givers) },
          { label: 'Gifts', value: String(summary.count) },
        ]}
      />

      <SegmentedControl
        label="Show"
        value={view}
        onChange={switchView}
        options={[
          { value: 'gifts', label: 'Gifts' },
          { value: 'categories', label: 'Categories' },
          { value: 'people', label: 'People' },
        ]}
      />

      {view === 'gifts' ? (
        <>
          {toRemember ? (
            <GiftRememberCard
              gift={toRemember}
              category={resolveGiftCategory(toRemember.categoryId, categories)}
              formatAmount={formatAmount}
              onOpen={() => openGift(toRemember)}
            />
          ) : null}

          {gifts.length >= SEARCH_FROM ? (
            <SearchField
              value={filter.query}
              onChangeText={(query) => setFilter((current) => ({ ...current, query }))}
              placeholder="Search gifts, people or notes"
              label="Search gifts"
            />
          ) : null}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            style={styles.chipStrip}>
            {filter.giver ? (
              <Chip
                label={`From ${filter.giver}  ✕`}
                accessibilityLabel={`Showing gifts from ${filter.giver}. Tap to show everyone.`}
                selected
                onPress={() => toggleChip({ giver: null })}
              />
            ) : null}
            <Chip
              label="All"
              selected={filter.categoryId === null && !filter.notThankedOnly}
              onPress={() => toggleChip({ categoryId: null, notThankedOnly: false })}
            />
            {summary.notThanked > 0 ? (
              <Chip
                label={`Not thanked yet (${summary.notThanked})`}
                selected={filter.notThankedOnly}
                onPress={() => toggleChip({ notThankedOnly: !filter.notThankedOnly })}
              />
            ) : null}
            {byCategory.length > 1
              ? byCategory.map((row) => (
                  <Chip
                    key={row.category.id}
                    label={`${row.category.name} (${row.count})`}
                    selected={filter.categoryId === row.category.id}
                    onPress={() =>
                      toggleChip({ categoryId: filter.categoryId === row.category.id ? null : row.category.id })
                    }
                  />
                ))
              : null}
          </ScrollView>

          {filtering ? (
            <View style={styles.countLine}>
              <ThemedText type="caption" themeColor="textSecondary" accessibilityLiveRegion="polite" style={styles.flex}>
                {`Showing ${visible.length} of ${plural(gifts.length, 'gift', 'gifts')}`}
              </ThemedText>
              <Button label="Clear" variant="ghost" onPress={() => toggleChip(NO_GIFT_FILTER)} style={styles.clear} />
            </View>
          ) : null}

          {visible.length === 0 ? (
            <Card>
              <EmptyState
                icon="text-search"
                title="No gifts match"
                message={
                  filter.notThankedOnly
                    ? 'You have thanked someone for every gift here. That is worth a moment.'
                    : 'Try another word, or clear the filters.'
                }
                actionLabel="Clear filters"
                onAction={() => toggleChip(NO_GIFT_FILTER)}
              />
            </Card>
          ) : (
            years.map((year) => (
              <Section
                key={year.year}
                title={String(year.year)}
                subtitle={`${formatAmount(year.total)} · ${plural(year.gifts.length, 'gift', 'gifts')}`}>
                <Card padded={false}>
                  {year.gifts.map((gift, index) => (
                    <View key={gift.id}>
                      {index > 0 ? <CardDivider /> : null}
                      <GiftRow
                        gift={gift}
                        category={resolveGiftCategory(gift.categoryId, categories)}
                        formatAmount={formatAmount}
                        onPress={() => openGift(gift)}
                        onToggleThanked={() => void toggleThanked(gift)}
                      />
                    </View>
                  ))}
                </Card>
              </Section>
            ))
          )}
        </>
      ) : null}

      {view === 'categories' ? (
        <Section
          title="Where it came from"
          subtitle="Tap a category to see its gifts."
          action={
            <IconButton
              icon="settings"
              variant="tinted"
              label="Manage categories"
              onPress={() => {
                triggerHaptic();
                setSheetOpen(true);
              }}
            />
          }>
          <GiftCategoryTotals
            rows={byCategory}
            lifetime={summary.lifetime}
            formatAmount={formatAmount}
            onOpen={(categoryId) => openGifts({ categoryId })}
          />
        </Section>
      ) : null}

      {view === 'people' ? (
        <Section title="The people who gave" subtitle="Tap someone to see what they gave.">
          <GiftGiverTotals
            rows={byGiver}
            unnamed={unnamed}
            formatAmount={formatAmount}
            onOpen={(giver) => openGifts({ giver })}
          />
        </Section>
      ) : null}

      <GiftCategoriesSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        categories={categories}
        gifts={gifts}
        onAdd={addCategory}
        onRename={renameCategory}
        onDelete={deleteCategory}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { textAlign: 'center' },
  chipStrip: { marginHorizontal: -Spacing.three },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.three },
  starters: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  countLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  // The kit button is full width; here it sits beside the count as a small link.
  clear: { paddingHorizontal: Spacing.two },
});
