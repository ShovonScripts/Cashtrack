import { router, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { GiftCategoriesSheet } from '@/components/gifts/gift-categories-sheet';
import { GiftRow } from '@/components/gifts/gift-row';
import { giftHueColor } from '@/components/gifts/gift-style';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Chip,
  HeroCard,
  IconButton,
  ProgressMeter,
  Screen,
  Section,
  SkeletonList,
  StatStrip,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { reloadReceivedGifts, useReceivedGifts } from '@/hooks/use-received-gifts';
import { triggerHaptic } from '@/utils/haptics';
import {
  groupGiftsByYear,
  resolveGiftCategory,
  summarizeGifts,
  totalsByCategory,
  totalsByGiver,
} from '@/utils/gifts';

/** People shown under "By person"; the rest are still in the list below. */
const TOP_GIVERS = 5;

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * Gifts Received: everything others have paid for you, kept apart from your
 * own money. The big number at the top is the point of the page — a reason to
 * be thankful — so it comes first, then where it came from, then the list.
 */
export default function GiftsScreen() {
  const { formatAmount } = usePreferences();
  const { status, gifts, categories, addCategory, renameCategory, deleteCategory } = useReceivedGifts();
  const [filter, setFilter] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const summary = useMemo(() => summarizeGifts(gifts), [gifts]);
  const byCategory = useMemo(() => totalsByCategory(gifts, categories), [gifts, categories]);
  const byGiver = useMemo(() => totalsByGiver(gifts).slice(0, TOP_GIVERS), [gifts]);
  // A filter on a category that no longer has gifts falls back to all.
  const activeFilter = filter && byCategory.some((row) => row.category.id === filter) ? filter : null;
  const years = useMemo(
    () =>
      groupGiftsByYear(
        activeFilter
          ? gifts.filter((gift) => resolveGiftCategory(gift.categoryId, categories).id === activeFilter)
          : gifts,
      ),
    [gifts, categories, activeFilter],
  );

  const addGift = () => {
    triggerHaptic();
    router.push('/gifts/add');
  };

  const header = (
    <Stack.Screen
      options={{
        headerRight: () => <IconButton icon="add" label="Add a gift" onPress={addGift} />,
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

  return (
    <Screen topInset={false}>
      {header}

      {gifts.length === 0 ? (
        <Card>
          <EmptyState
            icon="gift-outline"
            title="Nothing recorded yet"
            message="Write down what others have paid for you: a present, school fees your parents covered, a meal at an invitation, a doctor's bill someone settled, or a shop's discount. Seeing it all in one place is a reason to be thankful."
            actionLabel="Add your first gift"
            onAction={addGift}
          />
        </Card>
      ) : (
        <>
          <HeroCard
            eyebrow="RECEIVED FROM OTHERS"
            value={`${summary.hasEstimates ? '≈ ' : ''}${formatAmount(summary.lifetime)}`}
            caption="Everything others have paid for you. Take a moment to be thankful."
          />

          <StatStrip
            items={[
              { label: 'This year', value: formatAmount(summary.thisYear) },
              { label: 'People', value: String(summary.givers) },
              { label: 'Gifts', value: String(summary.count) },
            ]}
          />

          <Section title="By category">
            <Card>
              <View style={styles.meters}>
                {byCategory.map((row) => {
                  const share = summary.lifetime > 0 ? row.total / summary.lifetime : 0;
                  const percent = Math.round(share * 100);
                  return (
                    <ProgressMeter
                      key={row.category.id}
                      fill={share}
                      color={giftHueColor(row.category.hue)}
                      label={row.category.name}
                      valueText={`${formatAmount(row.total)}, ${percent} percent of everything received`}>
                      <View style={styles.meterLine}>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                          {row.category.name}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {formatAmount(row.total)} · {percent}%
                        </ThemedText>
                      </View>
                    </ProgressMeter>
                  );
                })}
              </View>
            </Card>
          </Section>

          {byGiver.length > 0 ? (
            <Section title="By person" subtitle="The people who gave the most">
              <Card padded={false}>
                {byGiver.map((row, index) => (
                  <View key={row.giver}>
                    {index > 0 ? <CardDivider /> : null}
                    <View
                      style={styles.giverRow}
                      accessible
                      accessibilityLabel={`${row.giver}, ${formatAmount(row.total)}, ${plural(row.count, 'gift', 'gifts')}`}>
                      <View style={styles.flex}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {row.giver}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {plural(row.count, 'gift', 'gifts')}
                        </ThemedText>
                      </View>
                      <ThemedText type="smallBold">{formatAmount(row.total)}</ThemedText>
                    </View>
                  </View>
                ))}
              </Card>
            </Section>
          ) : null}

          {byCategory.length > 1 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={styles.chipStrip}>
              <Chip label="All" selected={activeFilter === null} onPress={() => setFilter(null)} />
              {byCategory.map((row) => (
                <Chip
                  key={row.category.id}
                  label={`${row.category.name} (${row.count})`}
                  selected={activeFilter === row.category.id}
                  onPress={() => setFilter((current) => (current === row.category.id ? null : row.category.id))}
                />
              ))}
            </ScrollView>
          ) : null}

          {years.map((year) => (
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
                      onPress={() => router.push({ pathname: '/gifts/[id]', params: { id: gift.id } })}
                    />
                  </View>
                ))}
              </Card>
            </Section>
          ))}
        </>
      )}

      <Button label="Manage categories" variant="ghost" onPress={() => setSheetOpen(true)} />

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
  meters: { gap: Spacing.three },
  meterLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  giverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  chipStrip: { marginHorizontal: -Spacing.three },
  chips: { gap: Spacing.two, paddingHorizontal: Spacing.three },
});
