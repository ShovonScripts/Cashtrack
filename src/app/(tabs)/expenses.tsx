import { router } from 'expo-router';
import { useState } from 'react';
import { SectionList, Pressable, StyleSheet, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardDivider } from '@/components/card';
import { CategoryChips, type CategoryFilter } from '@/components/category-chips';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { filterExpenses, sortByDateDesc, sumAmounts } from '@/utils/expense';
import type { Expense } from '@/types/expense';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

type ExpenseSection = {
  title: string;
  data: Expense[];
  sectionTotal: number;
};

function formatSectionHeaderDate(dateString: string, today: Date): string {
  const d = new Date(dateString);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'TODAY';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'YESTERDAY';
  }
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  })
    .format(d)
    .toUpperCase();
}

function groupExpensesByDate(expensesList: Expense[], today: Date): ExpenseSection[] {
  const sorted = sortByDateDesc(expensesList);
  const groups = new Map<string, Expense[]>();

  sorted.forEach((expense) => {
    const key = formatSectionHeaderDate(expense.date, today);
    const existing = groups.get(key) ?? [];
    groups.set(key, [...existing, expense]);
  });

  return Array.from(groups.entries()).map(([title, items]) => ({
    title,
    data: items,
    sectionTotal: sumAmounts(items),
  }));
}

export default function ExpensesScreen() {
  const { expenses, categories, formatAmount } = useExpenses();
  const theme = useTheme();
  const now = useNow(60_000);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const visible = sortByDateDesc(filterExpenses(expenses, query, category));
  const isFiltering = query.trim().length > 0 || category !== 'All';
  const groupedSections = groupExpensesByDate(visible, now);

  const totalSpentVisible = sumAmounts(visible);
  const avgExpense = visible.length > 0 ? Math.round(totalSpentVisible / visible.length) : 0;

  const handleClear = () => {
    triggerHaptic();
    setQuery('');
    setCategory('All');
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <SectionList
        sections={groupedSections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four) },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Top Screen Title Row */}
            <View style={styles.titleRow}>
              <View style={styles.titleCopy}>
                <ThemedText type="title">Transactions & Expenses</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Searchable ledger, filter by tags & date
                </ThemedText>
              </View>
            </View>

            {/* Search Input Bar */}
            <View style={[styles.searchField, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <MaterialCommunityIcons name="magnify" size={20} color={theme.textSecondary} style={styles.searchIcon} />
              <TextInput
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                }}
                placeholder="Search note, category or amount…"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                accessibilityLabel="Search expenses"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {query.length > 0 && (
                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setQuery('');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search text"
                  hitSlop={8}
                  style={styles.clearSearch}>
                  <MaterialCommunityIcons name="close-circle" size={18} color={theme.textSecondary} />
                </Pressable>
              )}
            </View>

            {/* Category Filter Pills */}
            <CategoryChips
              value={category}
              onChange={(val) => {
                triggerHaptic();
                setCategory(val);
              }}
              showAll
              categories={categories}
            />

            {/* CashTrack Brand Multi-Tone Glass Hero Summary Card */}
            {expenses.length > 0 && (
              <View style={styles.heroGlassCard}>
                <View pointerEvents="none" style={styles.primaryBlueOrb} />
                <View pointerEvents="none" style={styles.brightCyanOrb} />

                <View style={styles.summaryTop}>
                  <ThemedText type="caption" style={styles.heroLabel}>
                    {isFiltering ? 'FILTERED TOTAL' : 'TOTAL TRANSACTIONS'}
                  </ThemedText>

                  {isFiltering && (
                    <Pressable
                      onPress={handleClear}
                      accessibilityRole="button"
                      hitSlop={8}
                      style={({ pressed }) => [styles.resetChip, pressed && styles.pressed]}>
                      <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                        Reset filters ✕
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(totalSpentVisible)}
                </ThemedText>

                <View style={styles.heroStatRow}>
                  <View style={styles.glassStatPill}>
                    <MaterialCommunityIcons name="receipt" size={13} color="#FFFFFF" />
                    <ThemedText type="caption" style={styles.glassStatText}>
                      {visible.length} {visible.length === 1 ? 'expense' : 'expenses'}
                    </ThemedText>
                  </View>

                  <View style={styles.glassStatPill}>
                    <MaterialCommunityIcons name="calculator-variant-outline" size={13} color={Brand.bright} />
                    <ThemedText type="caption" style={[styles.glassStatText, { color: Brand.bright }]}>
                      {formatAmount(avgExpense)} / item avg
                    </ThemedText>
                  </View>
                </View>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          expenses.length === 0 ? (
            <EmptyState title="No transactions yet" message="Add your first expense to track your spending." />
          ) : (
            <View style={styles.emptyResult}>
              <EmptyState
                title="No matching transactions"
                message="Try another search term or reset your category filters."
              />
              <Pressable
                onPress={handleClear}
                accessibilityRole="button"
                hitSlop={6}
                style={({ pressed }) => [styles.resetButton, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>Clear filters</ThemedText>
              </Pressable>
            </View>
          )
        }
        renderSectionHeader={({ section: { title, sectionTotal } }) => (
          <View style={styles.sectionHeaderRow}>
            <ThemedText type="caption" style={styles.sectionTitle}>
              {title}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionTotal}>
              {formatAmount(sectionTotal)}
            </ThemedText>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <Card padded={false} style={styles.itemCard}>
            <ExpenseListItem expense={item} />
            {index < section.data.length - 1 && <CardDivider />}
          </Card>
        )}
      />

      {/* Floating Action Button (FAB) for adding expense */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          router.push('/add-expense');
        }}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accentFill },
          pressed && styles.pressed,
        ]}>
        <MaterialCommunityIcons name="plus" size={28} color={theme.onBrand} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.three,
    paddingBottom: 110,
  },
  headerBlock: {
    gap: Spacing.two,
    marginBottom: Spacing.two,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  titleCopy: {
    flex: 1,
    gap: 1,
  },
  themeIconButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },
  searchField: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 8,
    fontSize: 14,
  },
  clearSearch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.deep, // #00109D
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    marginTop: Spacing.one,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.45)',
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
    zIndex: 2,
  },
  resetChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 2,
  },
  glassStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  glassStatText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
    paddingHorizontal: Spacing.one,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 1,
    fontSize: 10.5,
  },
  sectionTotal: {
    fontWeight: '700',
    fontSize: 11,
  },
  itemCard: {
    borderRadius: Radius.medium,
  },
  emptyResult: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  resetButton: {
    minHeight: 44,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});
