import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { getCategoryColor } from '@/constants/categories';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useIncome } from '@/context/income-context';
import { useTheme } from '@/hooks/use-theme';
import { getBudgetInsights, getCategoryMonthlySpend, getSmartFinancialIntelligence, type BudgetInsight } from '@/utils/advisor';
import { calculateMonthlyCashFlow } from '@/utils/income';
import { sumAmounts } from '@/utils/expense';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

export default function AdvisorScreen() {
  const theme = useTheme();
  const { expenses, categoryLimits, categories, categoryIcons, formatAmount } = useExpenses();
  const { incomeList } = useIncome();
  const now = new Date();
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(now);
  const insights = getBudgetInsights(expenses, categoryLimits, now);
  const cashFlow = calculateMonthlyCashFlow({ incomeList, expenses, month: now });
  const intelligence = getSmartFinancialIntelligence({ expenses, totalIncome: cashFlow.moneyIn, month: now });

  const monthTotal = sumAmounts(expenses.filter((expense) => {
    const date = new Date(expense.date);
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }));
  const unbudgeted = categories
    .filter((category) => categoryLimits[category] === undefined)
    .map((category) => ({ category, spent: getCategoryMonthlySpend(expenses, category, now) }))
    .filter((item) => item.spent > 0)
    .sort((first, second) => second.spent - first.spent)
    .slice(0, 3);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>YOUR MONTHLY CHECK-IN</ThemedText>
          <ThemedText type="subtitle" style={styles.title}>Spending advisor</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{monthLabel} · based on the expenses and limits you set</ThemedText>
        </View>

        {/* Smart Financial Intelligence Hero Card */}
        <View style={styles.intelligenceCard}>
          <View style={styles.intelligenceContent}>
            <View style={styles.intelligenceHeader}>
              <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>💡 Smart Financial Intelligence</ThemedText>
              <View style={[styles.statusBadge, { backgroundColor: intelligence.financialHealthStatus === 'Excellent' ? 'rgba(39, 174, 96, 0.25)' : intelligence.financialHealthStatus === 'Overspending' ? 'rgba(235, 87, 87, 0.25)' : 'rgba(255,255,255,0.15)' }]}>
                <ThemedText type="caption" style={{ color: intelligence.financialHealthStatus === 'Excellent' ? '#2ecc71' : intelligence.financialHealthStatus === 'Overspending' ? '#ff6b6b' : '#FFFFFF', fontWeight: '700' }}>
                  {intelligence.financialHealthStatus}
                </ThemedText>
              </View>
            </View>
            <ThemedText type="small" style={styles.intelligenceTip}>
              {intelligence.smartTip}
            </ThemedText>
            <View style={styles.intelligenceMetrics}>
              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Projected Total</ThemedText>
                <ThemedText type="smallBold" style={styles.intelMetricValue}>{formatAmount(intelligence.projectedMonthSpend)}</ThemedText>
              </View>
              <View style={styles.intelDivider} />
              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Daily Burn Rate</ThemedText>
                <ThemedText type="smallBold" style={styles.intelMetricValue}>{formatAmount(intelligence.dailyBurnRate)}/day</ThemedText>
              </View>
              <View style={styles.intelDivider} />
              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={{ color: 'rgba(255,255,255,0.7)' }}>Savings Rate</ThemedText>
                <ThemedText type="smallBold" style={{ color: intelligence.savingsRate >= 0 ? '#2ecc71' : '#ff6b6b' }}>{intelligence.savingsRate}%</ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </View>

        <Card style={{ ...styles.summaryCard, backgroundColor: insights.some((item) => item.level === 'over') ? 'rgba(200,37,44,0.09)' : theme.accentMuted }}>
          <ThemedText type="caption" themeColor="textSecondary">SPENT THIS MONTH</ThemedText>
          <ThemedText type="hero" style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{formatAmount(monthTotal)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {insights.length === 0
              ? categoryLimits && Object.keys(categoryLimits).length > 0 ? 'Your active limits are in a healthy range.' : 'Add category limits to get personalized budget heads-ups.'
              : `${insights.length} ${insights.length === 1 ? 'category needs' : 'categories need'} a check-in.`}
          </ThemedText>
        </Card>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Budget notices</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Heads-ups at 80%, over-limit alerts, and spending pace.</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/budgets');
            }}
            accessibilityRole="button"
            hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>Limits</ThemedText>
          </Pressable>
        </View>

        {insights.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="defaultBold" style={{ color: theme.accent }}>✓</ThemedText>
            </View>
            <ThemedText type="defaultBold">{Object.keys(categoryLimits).length ? 'You’re on track' : 'Start with a limit'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyMessage}>
              {Object.keys(categoryLimits).length
                ? 'No category has reached its heads-up point. Keep recording expenses to keep this view useful.'
                : 'Choose a monthly cap for categories that matter to you. CashTrack will flag them when spending gets close.'}
            </ThemedText>
            <ActionButton title={Object.keys(categoryLimits).length ? 'Review category limits' : 'Set category limits'} onPress={() => router.push('/budgets')} />
          </Card>
        ) : (
          <View style={styles.noticeList}>
            {insights.map((insight) => (
              <NoticeCard key={insight.category} insight={insight} formatAmount={formatAmount} categoryIcons={categoryIcons} />
            ))}
          </View>
        )}

        {unbudgeted.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionCopy}>
              <ThemedText type="defaultBold">Spending without a limit</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">A limit is optional—these are just your highest uncapped categories.</ThemedText>
            </View>
            <Card style={styles.uncappedCard}>
              {unbudgeted.map((item, index) => (
                <View key={item.category}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.uncappedRow}>
                    <CategoryIcon category={item.category} customIcons={categoryIcons} color={getCategoryColor(item.category)} size={15} containerSize={26} />
                    <ThemedText type="smallBold" style={styles.uncappedName}>{item.category}</ThemedText>
                    <ThemedText type="smallBold">{formatAmount(item.spent)}</ThemedText>
                  </View>
                </View>
              ))}
            </Card>
            <ActionButton title="Manage category limits" onPress={() => router.push('/budgets')} />
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Your monthly report</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Review your spending or save a shareable PDF.</ThemedText>
          </View>
          <ActionButton title="Open monthly reports" onPress={() => router.push('/reports')} />
        </View>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          These are simple reminders based on your own entries and limits—not financial advice.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

function NoticeCard({
  insight,
  formatAmount,
  categoryIcons,
}: {
  insight: BudgetInsight;
  formatAmount: (amount: number) => string;
  categoryIcons?: Record<string, string>;
}) {
  const theme = useTheme();
  const isOver = insight.level === 'over';
  const color = isOver ? theme.danger : insight.level === 'near' ? '#BD7119' : theme.accent;
  const title = insight.level === 'over'
    ? `${insight.category} is over its limit`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? `${insight.category} limit reached` : `${insight.category} is getting close`
      : `${insight.category} may go over at this pace`;
  const body = insight.level === 'over'
    ? `You’re ${formatAmount(Math.abs(insight.remaining))} above this month’s limit. Consider pausing non-essential spending in this category.`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? 'You’ve used the full limit. Any more spending will put this category over budget.' : `${formatAmount(insight.remaining)} remains. You’ve used ${Math.round(insight.percentUsed * 100)}% of the limit.`
      : `Based on spending so far, this category could reach ${formatAmount(insight.projectedSpend)} by month-end.`;

  return (
    <Card style={{ ...styles.noticeCard, borderLeftWidth: 4, borderLeftColor: color }}>
      <View style={styles.noticeHeading}>
        <CategoryIcon
          category={insight.category}
          customIcons={categoryIcons}
          color={color}
          size={15}
          containerSize={26}
        />
        <ThemedText type="defaultBold" style={styles.noticeTitle}>{title}</ThemedText>
        <View style={[styles.noticePill, { backgroundColor: isOver ? 'rgba(235, 87, 87, 0.15)' : insight.level === 'near' ? 'rgba(189, 113, 25, 0.15)' : theme.accentMuted }]}>
          <ThemedText type="caption" style={{ color, fontWeight: '700' }}>
            {isOver ? 'OVER' : insight.level === 'near' ? `${Math.round(insight.percentUsed * 100)}%` : 'PACE'}
          </ThemedText>
        </View>
      </View>
      <ThemedText type="small" themeColor="textSecondary">{body}</ThemedText>
      <View style={styles.noticeNumbers}>
        <ThemedText type="caption" themeColor="textSecondary">Spent {formatAmount(insight.spent)}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">Limit {formatAmount(insight.limit)}</ThemedText>
      </View>
    </Card>
  );
}

function ActionButton({ title, onPress }: { title: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.actionButton, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={styles.actionText}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  eyebrow: { letterSpacing: 1.1, fontWeight: '700' },
  title: { fontSize: 30, lineHeight: 36 },
  intelligenceCard: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    gap: Spacing.two,
  },
  intelligenceContent: {
    gap: Spacing.two,
    zIndex: 1,
  },
  intelligenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  intelligenceTip: {
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  intelligenceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: Spacing.two,
    marginTop: Spacing.half,
  },
  intelMetric: {
    flex: 1,
    gap: 2,
  },
  intelMetricValue: {
    color: '#FFFFFF',
    fontVariant: ['tabular-nums'],
  },
  intelDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: Spacing.two,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -80,
    top: -90,
    backgroundColor: 'rgba(139,123,255,0.2)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    right: 14,
    bottom: -90,
    backgroundColor: 'rgba(176,76,252,0.2)',
  },
  summaryCard: { gap: Spacing.one, borderWidth: 0 },
  summaryValue: { fontSize: 38, lineHeight: 46, fontVariant: ['tabular-nums'] },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  sectionCopy: { gap: Spacing.one },
  noticeList: { gap: Spacing.two },
  noticeCard: { gap: Spacing.two },
  noticeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  noticePill: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.small },
  noticeTitle: { flex: 1 },
  noticeNumbers: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, paddingTop: Spacing.one },
  emptyCard: { alignItems: 'center', gap: Spacing.two },
  emptyIcon: { width: 42, height: 42, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  emptyMessage: { textAlign: 'center', maxWidth: 440 },
  section: { gap: Spacing.two, marginTop: Spacing.one },
  uncappedCard: { gap: Spacing.one },
  uncappedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  categoryDot: { width: 8, height: 8, borderRadius: Radius.pill },
  uncappedName: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth },
  actionButton: { minHeight: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  actionText: { color: '#FFFFFF' },
  footer: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.three },
  pressed: { opacity: 0.75 },
});
