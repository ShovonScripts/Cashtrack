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
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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

function formatSectionHeaderDate(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (d.toDateString() === now.toDateString()) {
    return 'TODAY';
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return 'YESTERDAY';
  }
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' })
    .format(d)
    .toUpperCase();
}

function groupExpensesByDate(expensesList: Expense[]): ExpenseSection[] {
  const sorted = sortByDateDesc(expensesList);
  const groups = new Map<string, Expense[]>();

  sorted.forEach((expense) => {
    const key = formatSectionHeaderDate(expense.date);
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

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('All');

  const visible = sortByDateDesc(filterExpenses(expenses, query, category));
  const isFiltering = query.trim().length > 0 || category !== 'All';
  const groupedSections = groupExpensesByDate(visible);

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
        contentContainerStyle={[styles.contentContainer, { paddingTop: Math.max(insets.top, Spacing.three) }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            {/* Search Bar */}
            <View style={[styles.searchField, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <MaterialCommunityIcons name="magnify" size={22} color={theme.textSecondary} style={styles.searchIcon} />
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

            {/* Executive Summary Card */}
            {expenses.length > 0 && (
              <Card style={styles.summaryCard}>
                <View style={styles.summaryTop}>
                  <View style={styles.summaryCopy}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {isFiltering ? 'FILTERED TOTAL' : 'TOTAL TRANSACTIONS'}
                    </ThemedText>
                    <ThemedText type="hero" style={styles.summaryAmount} numberOfLines={1} adjustsFontSizeToFit>
                      {formatAmount(totalSpentVisible)}
                    </ThemedText>
                  </View>
                  {isFiltering && (
                    <Pressable
                      onPress={handleClear}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.resetChip, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
                      <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                        Reset filters ✕
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                <View style={[styles.summaryFooter, { borderTopColor: theme.border }]}>
                  <View style={styles.statItem}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      COUNT
                    </ThemedText>
                    <ThemedText type="smallBold">
                      {visible.length} {visible.length === 1 ? 'expense' : 'expenses'}
                    </ThemedText>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                  <View style={styles.statItem}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      AVERAGE
                    </ThemedText>
                    <ThemedText type="smallBold">
                      {formatAmount(avgExpense)} / item
                    </ThemedText>
                  </View>
                </View>
              </Card>
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
    padding: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerBlock: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  searchField: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    paddingHorizontal: Spacing.three,
  },
  searchIcon: {
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  clearSearch: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -Spacing.one,
  },
  summaryCard: {
    gap: Spacing.two,
    padding: Spacing.three,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryCopy: {
    gap: 2,
  },
  summaryAmount: {
    fontSize: 32,
    lineHeight: 40,
    fontVariant: ['tabular-nums'],
  },
  resetChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  summaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
    marginTop: Spacing.one,
  },
  statItem: {
    flex: 1,
    gap: 2,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
    marginHorizontal: Spacing.two,
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
    fontWeight: '700',
    letterSpacing: 1,
    fontSize: 11,
  },
  sectionTotal: {
    fontWeight: '600',
    fontSize: 11,
  },
  itemCard: {
    borderRadius: Radius.medium,
  },
  emptyResult: {
    alignItems: 'center',
    gap: Spacing.two,
  },
  resetButton: {
    minHeight: 42,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
