import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { formatDate, sortByDateDesc, sumAmounts } from '@/utils/expense';
import {
  filterExpensesByRange,
  getPeriodRange,
  getPeriodRangeLabel,
} from '@/utils/period-summary';

const MAX_VISIBLE_TRANSACTIONS = 100;

export default function PeriodReportScreen() {
  const theme = useTheme();
  const { expenses, categoryIcons, formatAmount, firstDayOfWeek } = useExpenses();
  const { period: periodParam } = useLocalSearchParams<{ period?: string }>();
  const period = periodParam === 'yearly' ? 'yearly' : 'weekly';

  const now = new Date();
  const range = getPeriodRange(period, now, firstDayOfWeek);
  const rangeLabel = getPeriodRangeLabel(period, now, firstDayOfWeek);
  const periodExpenses = sortByDateDesc(filterExpensesByRange(expenses, range));
  const total = sumAmounts(periodExpenses);
  const count = periodExpenses.length;
  const average = count > 0 ? total / count : 0;
  const largest = count > 0 ? Math.max(...periodExpenses.map((expense) => expense.amount)) : 0;

  const categoryTotals = new Map<string, number>();
  for (const expense of periodExpenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }
  const categories = [...categoryTotals.entries()].sort((first, second) => second[1] - first[1]);
  const topCategory = categories[0]?.[0] ?? 'None';
  const visibleExpenses = periodExpenses.slice(0, MAX_VISIBLE_TRANSACTIONS);

  const title = period === 'weekly' ? 'Weekly Spending' : 'Yearly Spending';
  const totalLabel = period === 'weekly' ? 'TOTAL THIS WEEK' : 'TOTAL THIS YEAR';

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
            SPENDING REPORT
          </ThemedText>
          <ThemedText type="title">{title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{rangeLabel}</ThemedText>
        </View>

        <View style={styles.heroCard}>
          <View pointerEvents="none" style={styles.primaryOrb} />
          <View pointerEvents="none" style={styles.cyanOrb} />

          <View style={styles.heroTopline}>
            <ThemedText type="caption" style={styles.heroLabel}>{totalLabel}</ThemedText>
            <View style={styles.heroPill}>
              <MaterialCommunityIcons name="calendar-range" size={12} color={Brand.bright} />
              <ThemedText type="caption" style={styles.heroPillText}>{rangeLabel}</ThemedText>
            </View>
          </View>

          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(total)}
          </ThemedText>

          <View style={styles.heroFooter}>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="receipt" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {count} {count === 1 ? 'transaction' : 'transactions'}
              </ThemedText>
            </View>
            <View style={styles.heroStatPill}>
              <MaterialCommunityIcons name="tag" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={styles.heroDetailText}>
                {categories.length} {categories.length === 1 ? 'category' : 'categories'}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">AVERAGE</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {formatAmount(average)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">LARGEST</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {formatAmount(largest)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <ThemedText type="caption" themeColor="textSecondary">TOP CATEGORY</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1}>
              {topCategory}
            </ThemedText>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Category Breakdown</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Share of period spending</ThemedText>
        </View>

        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="defaultBold">No expenses in this period</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Add an expense to see its category breakdown here.
            </ThemedText>
          </Card>
        ) : (
          <Card style={styles.breakdownCard}>
            {categories.map(([category, amount], index) => {
              const percent = total > 0 ? (amount / total) * 100 : 0;
              const color = getCategoryColor(category);
              return (
                <View key={category} style={styles.categoryItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.categoryLine}>
                    <CategoryIcon category={category} customIcons={categoryIcons} color={color} size={15} containerSize={28} />
                    <ThemedText type="smallBold" style={styles.categoryName}>{category}</ThemedText>
                    <ThemedText type="smallBold">{formatAmount(amount)} ({percent.toFixed(0)}%)</ThemedText>
                  </View>
                  <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.progressFill, { width: `${Math.max(percent, 3)}%`, backgroundColor: color }]} />
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Transactions</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">{count} entries</ThemedText>
        </View>

        {visibleExpenses.length > 0 ? (
          <Card style={styles.transactionCard}>
            {visibleExpenses.map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                <View style={styles.transactionRow}>
                  <CategoryIcon
                    category={expense.category}
                    customIcons={categoryIcons}
                    color={getCategoryColor(expense.category)}
                    size={16}
                    containerSize={36}
                  />
                  <View style={styles.transactionCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {expense.note || expense.category}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {expense.category} · {formatDate(expense.date)}
                    </ThemedText>
                  </View>
                  <ThemedText type="smallBold" style={styles.amount}>
                    {formatAmount(expense.amount)}
                  </ThemedText>
                </View>
              </View>
            ))}
            {count > visibleExpenses.length && (
              <ThemedText type="caption" themeColor="textSecondary" style={styles.listNote}>
                Showing the latest {visibleExpenses.length} transactions.
              </ThemedText>
            )}
          </Card>
        ) : (
          <Card style={styles.emptyCard}>
            <ThemedText type="small" themeColor="textSecondary">No transactions recorded.</ThemedText>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  intro: { gap: Spacing.one },
  eyebrow: { letterSpacing: 1, fontWeight: '800', fontSize: 10 },
  heroCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
  },
  primaryOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.45)',
  },
  cyanOrb: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    zIndex: 2,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '800',
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(20, 231, 253, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  heroPillText: { color: Brand.bright, fontWeight: '700' },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
    zIndex: 2,
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
    zIndex: 2,
  },
  heroStatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  heroDetailText: { color: '#FFFFFF', fontWeight: '600', fontSize: 12 },
  metricsRow: { flexDirection: 'row', gap: Spacing.two },
  metricCard: { flex: 1, gap: Spacing.one, padding: Spacing.three },
  metricValue: { fontSize: 15, fontVariant: ['tabular-nums'] },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  breakdownCard: { gap: Spacing.two },
  categoryItem: { gap: Spacing.one },
  categoryLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryName: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
  progressTrack: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: Radius.pill },
  transactionCard: { gap: Spacing.one },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  transactionCopy: { flex: 1, gap: 2 },
  amount: { fontVariant: ['tabular-nums'] },
  listNote: { textAlign: 'center', paddingTop: Spacing.two },
  emptyCard: { gap: Spacing.one, alignItems: 'center', paddingVertical: Spacing.four },
});
