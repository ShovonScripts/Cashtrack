import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useIncome } from '@/context/income-context';
import { useTheme } from '@/hooks/use-theme';
import { generateFinancialInsights } from '@/utils/insights-calculator';
import { getCategoryColor } from '@/constants/categories';

function sameMonth(first: Date, second: Date) {
  return first.getFullYear() === second.getFullYear() && first.getMonth() === second.getMonth();
}

export default function InsightsScreen() {
  const theme = useTheme();
  const { expenses, categoryLimits, formatAmount } = useExpenses();
  const { incomeList } = useIncome();

  const [month, setMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1, 12);
  });

  const isCurrentMonth = sameMonth(month, new Date());
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);

  const insightsResult = generateFinancialInsights({
    incomeList,
    expenses,
    limits: categoryLimits,
    targetMonth: month,
  });

  const { summary, categories, trend, budgetHealth, insights } = insightsResult;

  const changeMonth = (amount: number) => {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  };

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Month Selector */}
        <Card style={styles.monthSelector}>
          <Pressable onPress={() => changeMonth(-1)} accessibilityRole="button" accessibilityLabel="Previous month" style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <ThemedText type="subtitle" style={styles.arrowText}>‹</ThemedText>
          </Pressable>
          <View style={styles.monthLabelBlock}>
            <ThemedText type="defaultBold" style={styles.monthLabel}>{monthLabel}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{isCurrentMonth ? 'Month to date' : 'Full month'}</ThemedText>
          </View>
          <Pressable
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            accessibilityState={{ disabled: isCurrentMonth }}
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }, isCurrentMonth && styles.disabled]}>
            <ThemedText type="subtitle" style={styles.arrowText}>›</ThemedText>
          </Pressable>
        </Card>

        {/* Hero Summary Card */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <ThemedText type="caption" style={styles.heroLabel}>SAVINGS RATE</ThemedText>
            <ThemedText type="hero" style={styles.heroVal} numberOfLines={1} adjustsFontSizeToFit>
              {summary.savingsRate !== null ? `${summary.savingsRate.toFixed(1)}%` : 'N/A'}
            </ThemedText>
            <View style={styles.heroMetrics}>
              <View style={styles.heroMetric}>
                <ThemedText type="caption" style={styles.heroStatLabel}>MONEY IN</ThemedText>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{formatAmount(summary.moneyIn)}</ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroMetric}>
                <ThemedText type="caption" style={styles.heroStatLabel}>MONEY OUT</ThemedText>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{formatAmount(summary.moneyOut)}</ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroMetric}>
                <ThemedText type="caption" style={styles.heroStatLabel}>NET</ThemedText>
                <ThemedText type="smallBold" style={{ color: summary.net >= 0 ? '#27AE60' : '#FF6B6B' }}>{formatAmount(summary.net)}</ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrb} />
        </View>

        {/* Key Insights */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Smart observations</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Data-driven summaries</ThemedText>
        </View>

        {insights.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState title="No insights yet" message="Record income and expenses for this month to generate financial insights." tone={theme.accent} />
          </Card>
        ) : (
          <Card style={styles.insightsCard}>
            {insights.map((text, idx) => (
              <View key={`insight-${idx}`} style={styles.insightRow}>
                <View style={[styles.insightDot, { backgroundColor: theme.accent }]} />
                <ThemedText type="small" style={styles.insightText}>{text}</ThemedText>
              </View>
            ))}
          </Card>
        )}

        {/* Spending Trend */}
        <Card style={styles.card}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultBold">Spending trend</ThemedText>
            <ThemedText type="smallBold" style={{ color: trend.direction === 'Increasing' ? theme.danger : '#27AE60' }}>
              {trend.direction}
            </ThemedText>
          </View>
          <View style={styles.trendRow}>
            <TrendMetric label="This Month" value={formatAmount(trend.currentMonthTotal)} />
            <TrendMetric label="Previous" value={formatAmount(trend.previousMonthTotal)} />
            <TrendMetric label="3-Mo Avg" value={formatAmount(trend.averageMonthlyTotal)} />
          </View>
        </Card>

        {/* Category Breakdown */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Category spending analysis</ThemedText>
          <Pressable onPress={() => router.push('/expenses')} accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: theme.accent }}>Expenses →</ThemedText>
          </Pressable>
        </View>

        {categories.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="small" themeColor="textSecondary">No expenses recorded this month.</ThemedText>
          </Card>
        ) : (
          <Card style={styles.card}>
            {categories.map((item, index) => {
              const color = getCategoryColor(item.category);
              return (
                <View key={item.category} style={styles.catItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.catTopRow}>
                    <View style={[styles.catDot, { backgroundColor: color }]} />
                    <ThemedText type="smallBold" style={styles.catName}>{item.category}</ThemedText>
                    <ThemedText type="smallBold">{formatAmount(item.spent)} <ThemedText type="caption" themeColor="textSecondary">({item.percentage.toFixed(0)}%)</ThemedText></ThemedText>
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {/* Budget Health */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">Budget health</ThemedText>
          <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: theme.accent }}>Manage limits →</ThemedText>
          </Pressable>
        </View>

        {budgetHealth.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState title="No category limits set" message="Set spending caps on categories to track budget health." tone={theme.accent} />
          </Card>
        ) : (
          <Card style={styles.card}>
            {budgetHealth.map((item, index) => {
              const over = item.status === 'Over Budget';
              const color = over ? theme.danger : item.status === 'Approaching Limit' ? '#BD7119' : '#27AE60';
              return (
                <View key={item.category} style={styles.budgetHealthItem}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.budgetHealthTop}>
                    <ThemedText type="smallBold">{item.category}</ThemedText>
                    <ThemedText type="caption" style={{ color, fontWeight: '700' }}>{item.status}</ThemedText>
                  </View>
                  <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                    <View style={[styles.fill, { width: `${Math.min(100, item.percentageUsed)}%`, backgroundColor: color }]} />
                  </View>
                  <View style={styles.budgetHealthFoot}>
                    <ThemedText type="caption" themeColor="textSecondary">Spent {formatAmount(item.spent)} / Limit {formatAmount(item.limit)}</ThemedText>
                    <ThemedText type="caption" themeColor={over ? 'danger' : 'textSecondary'}>
                      {over ? `${formatAmount(Math.abs(item.remaining))} over` : `${formatAmount(item.remaining)} left`}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function TrendMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.trendMetric}>
      <ThemedText type="caption" themeColor="textSecondary">{label}</ThemedText>
      <ThemedText type="defaultBold" style={styles.trendVal} numberOfLines={1}>{value}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, padding: Spacing.two },
  monthArrow: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  arrowText: { fontSize: 28, lineHeight: 34 },
  monthLabelBlock: { flex: 1, alignItems: 'center', gap: 2 },
  monthLabel: { fontSize: 18 },
  hero: { borderRadius: Radius.xlarge, padding: Spacing.four, overflow: 'hidden', justifyContent: 'center' },
  heroContent: { gap: Spacing.one, zIndex: 1 },
  heroLabel: { color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  heroVal: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontVariant: ['tabular-nums'] },
  heroMetrics: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)', paddingTop: Spacing.two },
  heroMetric: { flex: 1, gap: 2, alignItems: 'center' },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 26, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroOrb: { position: 'absolute', width: 200, height: 200, borderRadius: 100, right: -70, top: -80, backgroundColor: 'rgba(139,123,255,0.2)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.one },
  card: { gap: Spacing.three },
  insightsCard: { gap: Spacing.two },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  insightDot: { width: 6, height: 6, borderRadius: Radius.pill, marginTop: 6 },
  insightText: { flex: 1, lineHeight: 20 },
  trendRow: { flexDirection: 'row', gap: Spacing.two },
  trendMetric: { flex: 1, backgroundColor: 'rgba(0,0,0,0.02)', padding: Spacing.three, borderRadius: Radius.medium, gap: 2, alignItems: 'center' },
  trendVal: { fontSize: 15 },
  catItem: { gap: Spacing.one },
  catTopRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  catDot: { width: 8, height: 8, borderRadius: Radius.pill },
  catName: { flex: 1 },
  budgetHealthItem: { gap: Spacing.two },
  budgetHealthTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  track: { height: 6, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  budgetHealthFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.75 },
});
