import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
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

  // Cash Flow calculation
  const cashFlowRatio = cashFlow.moneyIn > 0 ? Math.min(1, monthTotal / cashFlow.moneyIn) : 1;

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Intro Topline */}
        <View style={styles.intro}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
            AI FINANCIAL INTELLIGENCE
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {monthLabel} · Live spending analysis & budget advisor
          </ThemedText>
        </View>

        {/* Multi-Tone Spendly Brand Glass Hero Card */}
        <View style={styles.intelligenceHeroGlass}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.intelligenceContent}>
            <View style={styles.intelligenceHeader}>
              <View style={styles.liveAiBadge}>
                <Ionicons name="sparkles" size={12} color="#4ade80" />
                <ThemedText type="caption" style={{ color: '#4ade80', fontWeight: '800' }}>
                  Live AI Advisor
                </ThemedText>
              </View>

              <View style={[styles.statusBadge, {
                backgroundColor: intelligence.financialHealthStatus === 'Excellent'
                  ? 'rgba(16, 185, 129, 0.25)'
                  : intelligence.financialHealthStatus === 'Overspending'
                    ? 'rgba(239, 68, 68, 0.25)'
                    : 'rgba(255, 255, 255, 0.18)'
              }]}>
                <ThemedText type="caption" style={{
                  color: intelligence.financialHealthStatus === 'Excellent'
                    ? '#34D399'
                    : intelligence.financialHealthStatus === 'Overspending'
                      ? '#F87171'
                      : '#FFFFFF',
                  fontWeight: '800'
                }}>
                  {intelligence.financialHealthStatus}
                </ThemedText>
              </View>
            </View>

            <ThemedText type="smallBold" style={styles.intelligenceTip}>
              {intelligence.smartTip}
            </ThemedText>

            <View style={styles.intelligenceMetrics}>
              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={styles.metricLabel}>Projected Month</ThemedText>
                <ThemedText type="smallBold" style={styles.intelMetricValue}>
                  {formatAmount(intelligence.projectedMonthSpend)}
                </ThemedText>
              </View>

              <View style={styles.intelDivider} />

              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={styles.metricLabel}>Daily Burn Rate</ThemedText>
                <ThemedText type="smallBold" style={styles.intelMetricValue}>
                  {formatAmount(intelligence.dailyBurnRate)}/day
                </ThemedText>
              </View>

              <View style={styles.intelDivider} />

              <View style={styles.intelMetric}>
                <ThemedText type="caption" style={styles.metricLabel}>Savings Rate</ThemedText>
                <ThemedText type="smallBold" style={{
                  color: intelligence.savingsRate >= 0 ? '#34D399' : '#F87171',
                  fontWeight: '800'
                }}>
                  {intelligence.savingsRate}%
                </ThemedText>
              </View>
            </View>
          </View>
        </View>

        {/* Monthly Cash Flow Visualizer Card */}
        <Card style={styles.cashFlowCard}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="swap-horizontal-bold" size={18} color={theme.accent} />
              <ThemedText type="defaultBold" style={{ fontSize: 15 }}>
                Monthly Cash Flow
              </ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {monthLabel}
            </ThemedText>
          </View>

          <View style={styles.cashFlowNumbers}>
            <View style={styles.cashFlowCol}>
              <ThemedText type="caption" themeColor="textSecondary">INCOME (IN)</ThemedText>
              <ThemedText type="subtitle" style={{ color: '#10B981', fontWeight: '800' }}>
                +{formatAmount(cashFlow.moneyIn)}
              </ThemedText>
            </View>
            <View style={styles.cashFlowColEnd}>
              <ThemedText type="caption" themeColor="textSecondary">SPENT (OUT)</ThemedText>
              <ThemedText type="subtitle" style={{ color: theme.danger, fontWeight: '800' }}>
                -{formatAmount(monthTotal)}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
            <View style={[styles.fill, {
              width: `${Math.round(cashFlowRatio * 100)}%`,
              backgroundColor: cashFlowRatio > 0.9 ? theme.danger : cashFlowRatio > 0.75 ? '#BD7119' : '#10B981'
            }]} />
          </View>

          <View style={styles.cashFlowFooter}>
            <ThemedText type="caption" themeColor="textSecondary">
              Net Balance: <ThemedText type="smallBold" style={{ color: cashFlow.net >= 0 ? '#10B981' : theme.danger }}>
                {cashFlow.net >= 0 ? `+${formatAmount(cashFlow.net)}` : formatAmount(cashFlow.net)}
              </ThemedText>
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {Math.round(cashFlowRatio * 100)}% of income spent
            </ThemedText>
          </View>
        </Card>

        {/* Section Header: Budget Notices */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <ThemedText type="defaultBold">Budget Heads-Up & Warnings</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Categories approaching or exceeding monthly caps.</ThemedText>
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/budgets');
            }}
            accessibilityRole="button"
            hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>Manage Limits</ThemedText>
          </Pressable>
        </View>

        {insights.length === 0 ? (
          <Card style={styles.emptyCard}>
            <View style={[styles.emptyIcon, { backgroundColor: '#10B9811C' }]}>
              <MaterialCommunityIcons name="shield-check" size={24} color="#10B981" />
            </View>
            <ThemedText type="defaultBold">
              {Object.keys(categoryLimits).length ? 'All Categories Healthy' : 'Set Category Limits'}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyMessage}>
              {Object.keys(categoryLimits).length
                ? 'None of your spending categories have crossed their alert thresholds.'
                : 'Assign monthly spending caps to get real-time heads-ups when spending gets close to your limits.'}
            </ThemedText>
            <ActionButton
              title={Object.keys(categoryLimits).length ? 'Review Category Caps' : 'Set Category Caps'}
              onPress={() => router.push('/budgets')}
            />
          </Card>
        ) : (
          <View style={styles.noticeList}>
            {insights.map((insight) => (
              <NoticeCard key={insight.category} insight={insight} formatAmount={formatAmount} categoryIcons={categoryIcons} />
            ))}
          </View>
        )}

        {/* Section: Uncapped Categories */}
        {unbudgeted.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionCopy}>
              <ThemedText type="defaultBold">Highest Uncapped Spending</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">Top categories without a monthly budget cap.</ThemedText>
            </View>
            <Card style={styles.uncappedCard}>
              {unbudgeted.map((item, index) => (
                <View key={item.category}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                  <View style={styles.uncappedRow}>
                    <CategoryIcon category={item.category} customIcons={categoryIcons} color={getCategoryColor(item.category)} size={16} containerSize={32} />
                    <View style={{ flex: 1, gap: 1 }}>
                      <ThemedText type="smallBold">{item.category}</ThemedText>
                      <ThemedText type="caption" themeColor="textSecondary">
                        Spent {formatAmount(item.spent)}
                      </ThemedText>
                    </View>
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        router.push('/budgets');
                      }}
                      style={({ pressed }) => [styles.capBtn, { backgroundColor: theme.cardMuted, borderColor: theme.border }, pressed && styles.pressed]}>
                      <MaterialCommunityIcons name="plus" size={13} color={theme.accent} />
                      <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>
                        Set Cap
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* Quick Shortcuts Bar */}
        <View style={styles.section}>
          <ThemedText type="defaultBold">Quick Shortcuts</ThemedText>
          <View style={styles.shortcutGrid}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/budgets');
              }}
              style={({ pressed }) => [styles.shortcutCard, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="chart-box-outline" size={22} color={theme.accent} />
              <ThemedText type="smallBold">Budget Caps</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/reports');
              }}
              style={({ pressed }) => [styles.shortcutCard, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color="#10B981" />
              <ThemedText type="smallBold">Monthly Reports</ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/expenses');
              }}
              style={({ pressed }) => [styles.shortcutCard, { backgroundColor: theme.card, borderColor: theme.border }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="format-list-bulleted" size={22} color="#F59E0B" />
              <ThemedText type="smallBold">All Expenses</ThemedText>
            </Pressable>
          </View>
        </View>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          CashTrack Advisor provides automated reminders and insights based on your entries—not professional financial advice.
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
    ? `${insight.category} is over limit`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? `${insight.category} limit reached` : `${insight.category} near limit`
      : `${insight.category} spending pace alert`;

  const body = insight.level === 'over'
    ? `You’re ${formatAmount(Math.abs(insight.remaining))} above this month’s cap. Consider pausing non-essential expenses.`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? 'Full cap reached. Any further spending will exceed your budget.' : `${formatAmount(insight.remaining)} left (${Math.round(insight.percentUsed * 100)}% used).`
      : `At this current pace, month-end spend could reach ${formatAmount(insight.projectedSpend)}.`;

  const progressPercent = Math.min(100, Math.round(insight.percentUsed * 100));

  return (
    <Card style={{ ...styles.noticeCard, borderLeftWidth: 4, borderLeftColor: color }}>
      <View style={styles.noticeHeading}>
        <CategoryIcon
          category={insight.category}
          customIcons={categoryIcons}
          color={color}
          size={16}
          containerSize={32}
        />
        <ThemedText type="defaultBold" style={styles.noticeTitle}>{title}</ThemedText>
        <View style={[styles.noticePill, { backgroundColor: isOver ? 'rgba(239, 68, 68, 0.15)' : insight.level === 'near' ? 'rgba(189, 113, 25, 0.15)' : theme.accentMuted }]}>
          <ThemedText type="caption" style={{ color, fontWeight: '800' }}>
            {isOver ? 'OVER' : insight.level === 'near' ? `${progressPercent}%` : 'PACE'}
          </ThemedText>
        </View>
      </View>

      <ThemedText type="small" themeColor="textSecondary">{body}</ThemedText>

      {/* Progress Track */}
      <View style={styles.noticeProgressBlock}>
        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.fill, { width: `${progressPercent}%`, backgroundColor: color }]} />
        </View>
        <View style={styles.noticeNumbers}>
          <ThemedText type="caption" themeColor="textSecondary">Spent: <ThemedText type="smallBold" style={{ color: theme.text }}>{formatAmount(insight.spent)}</ThemedText></ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Cap: <ThemedText type="smallBold" style={{ color: theme.text }}>{formatAmount(insight.limit)}</ThemedText></ThemedText>
        </View>
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
  eyebrow: { letterSpacing: 1.1, fontWeight: '800', fontSize: 10 },
  intelligenceHeroGlass: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.5)',
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -50,
    left: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
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
  liveAiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  intelligenceTip: {
    color: '#FFFFFF',
    lineHeight: 20,
    fontSize: 14,
  },
  intelligenceMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: Spacing.two,
    marginTop: Spacing.half,
  },
  intelMetric: {
    flex: 1,
    gap: 2,
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 10,
    fontWeight: '700',
  },
  intelMetricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  intelDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: Spacing.one,
  },
  cashFlowCard: { gap: Spacing.two },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cashFlowNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashFlowCol: { gap: 2 },
  cashFlowColEnd: { gap: 2, alignItems: 'flex-end' },
  cashFlowFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.one },
  sectionCopy: { gap: Spacing.one },
  noticeList: { gap: Spacing.two },
  noticeCard: { gap: Spacing.two },
  noticeHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  noticePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  noticeTitle: { flex: 1, fontSize: 14 },
  noticeProgressBlock: { gap: 6, marginTop: 4 },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  noticeNumbers: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyCard: { alignItems: 'center', gap: Spacing.two, padding: Spacing.four },
  emptyIcon: { width: 44, height: 44, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  emptyMessage: { textAlign: 'center', maxWidth: 440 },
  section: { gap: Spacing.two, marginTop: Spacing.one },
  uncappedCard: { gap: Spacing.one },
  uncappedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  capBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth },
  divider: { height: StyleSheet.hairlineWidth },
  shortcutGrid: { flexDirection: 'row', gap: Spacing.two },
  shortcutCard: { flex: 1, padding: Spacing.three, borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionButton: { minHeight: 46, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.three },
  actionText: { color: '#FFFFFF' },
  footer: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.three, marginTop: Spacing.one },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
});
