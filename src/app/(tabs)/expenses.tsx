import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SectionList, Pressable, StyleSheet, TextInput, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, CardDivider } from '@/components/card';
import { CategoryChips, type CategoryFilter } from '@/components/category-chips';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { canUndoDelete, useUndoDelete } from '@/context/undo-delete-context';
import { Button, ScreenHeader, StatStrip } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
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
  const { expenses: allExpenses } = useExpenses();
  const { pendingDeleteIds, requestDelete } = useUndoDelete();
  const expenses = useMemo(
    () => allExpenses.filter((expense) => !pendingDeleteIds.has(expense.id)),
    [allExpenses, pendingDeleteIds]
  );
  const { categories, formatAmount } = usePreferences();
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
            <ScreenHeader title="Transactions" subtitle="Search and filter your spending" />

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

            {expenses.length > 0 && (
              <>
                <StatStrip
                  items={[
                    { label: isFiltering ? 'Filtered total' : 'Total', value: formatAmount(totalSpentVisible) },
                    { label: 'Expenses', value: String(visible.length) },
                    { label: 'Average', value: formatAmount(avgExpense) },
                  ]}
                />
                {isFiltering && <Button label="Reset filters" variant="ghost" onPress={handleClear} />}
              </>
            )}
          </View>
        }
        ListEmptyComponent={
          expenses.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              message="Add your first expense to track your spending."
              icon="receipt-text-outline"
              actionLabel="Add expense"
              onAction={() => router.push('/add-expense')}
            />
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
            <ExpenseListItem expense={item} onSwipeDelete={canUndoDelete(item) ? requestDelete : undefined} />
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
          { backgroundColor: theme.accentFill, bottom: Math.max(Spacing.four, insets.bottom + 16) },
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
    marginEnd: 8,
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
