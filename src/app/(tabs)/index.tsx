import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { MoneySummaryCard } from '@/components/money-summary-card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useDebts } from '@/context/debt-context';
import { useIncome } from '@/context/income-context';
import { useGoals } from '@/context/goal-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { sortByDateDesc, sumAmounts, totalForDate, totalForMonth } from '@/utils/expense';
import { calculateMonthlyCashFlow } from '@/utils/income';
import type { Expense } from '@/types/expense';
import { getBudgetInsights, type BudgetInsight } from '@/utils/advisor';
import { getRemainingBalance, summarizeDebts } from '@/utils/debt';
import { FacebookCoverHeader } from '@/components/dashboard/facebook-cover-header';
import { CostSummaryCarousel } from '@/components/dashboard/cost-summary-carousel';
import { buildCategoryBreakdowns, buildCostSummaries, getAddExpenseDate, getWeekDays, type SummaryPeriod } from '@/utils/period-summary';

const RECENT_LIMIT = 5;

type DaySpend = {
  date: Date;
  label: string;
  amount: number;
};

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

function getWeekSpending(expenses: Expense[], today: Date, firstDayOfWeek: 'monday' | 'sunday'): DaySpend[] {
  return getWeekDays(today, firstDayOfWeek).map((date) => ({
    date,
    label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
    amount: totalForDate(expenses, date),
  }));
}


function WeeklySpending({ expenses, today, firstDayOfWeek, formatAmount }: { expenses: Expense[]; today: Date; firstDayOfWeek: 'monday' | 'sunday'; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const days = getWeekSpending(expenses, today, firstDayOfWeek);
  const maxAmount = Math.max(...days.map((day) => day.amount), 1);
  const weeklyTotal = days.reduce((total, day) => total + day.amount, 0);
  const dailyAvg = Math.round(weeklyTotal / 7);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const selectedDay = selectedDayIndex !== null ? days[selectedDayIndex] : null;

  return (
    <Card style={styles.weekCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">
            {selectedDay ? new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(selectedDay.date) : 'This week'}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {selectedDay ? (selectedDay.amount > 0 ? `Spent ${formatAmount(selectedDay.amount)}` : 'No expenses recorded') : `Daily avg: ${formatAmount(dailyAvg)}`}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setSelectedDayIndex(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Reset view to weekly total"
          style={[styles.weekTotalBadge, { backgroundColor: theme.accentMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {selectedDay ? formatAmount(selectedDay.amount) : formatAmount(weeklyTotal)}
          </ThemedText>
        </Pressable>
      </View>

      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`Spending over the last seven days totals ${formatAmount(weeklyTotal)}`}>
        {days.map((day, index) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const isSelected = selectedDayIndex === index;
          const barHeight = day.amount > 0 ? Math.max(8, (day.amount / maxAmount) * 74) : 5;
          return (
            <Pressable
              key={day.date.toISOString()}
              onPress={() => {
                triggerHaptic();
                setSelectedDayIndex(isSelected ? null : index);
              }}
              accessibilityRole="button"
              style={styles.chartColumn}
              accessible
              accessibilityLabel={`${new Intl.DateTimeFormat('en', { weekday: 'long' }).format(day.date)}: ${formatAmount(day.amount)}`}>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isSelected ? '#FFFFFF' : isToday ? theme.accent : theme.accentMuted,
                      borderColor: isSelected ? theme.accent : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                themeColor={isSelected || isToday ? 'text' : 'textSecondary'}
                style={isSelected || isToday ? styles.todayLabel : undefined}>
                {day.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function MoneyPlanSummaryCard({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { goals } = useGoals();
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const totalSaved = goals.reduce((sum, g) => sum + g.contributedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  return (
    <View style={styles.heroCardSummary}>
      {/* Spendly Brand Ambient Background Orbs */}
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />

      <View style={styles.heroContent}>
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/goals');
          }}
          accessibilityRole="button"
          accessibilityLabel={`Money plan and pots. ${formatAmount(totalSaved)} saved of ${formatAmount(totalTarget)}. ${activeGoals.length} active ${activeGoals.length === 1 ? 'pot' : 'pots'}. ${overallProgress}% saved.`}
          accessibilityHint="Opens the savings goals and pots page"
          style={({ pressed }) => [styles.cardPressArea, pressed && styles.cardPressed]}>
          {/* Topline: Label & Pill */}
          <View style={styles.heroTopline}>
            <ThemedText type="caption" style={styles.heroLabel}>
              MONEY PLAN & POTS
            </ThemedText>
            <View style={styles.monthPill}>
              <ThemedText type="caption" style={styles.monthPillText}>{overallProgress}% saved</ThemedText>
            </View>
          </View>

          {/* Main Hero Value - Pure White like Daily Cost card */}
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(totalSaved)}
          </ThemedText>

          {/* Footer Metrics Row with Clean White Style */}
          <View style={styles.footerRow}>
            <View style={styles.metricsPillsRow}>
              <View style={styles.whiteChip}>
                <View style={styles.cyanDot} />
                <ThemedText type="small" style={styles.chipText}>
                  {activeGoals.length} {activeGoals.length === 1 ? 'active pot' : 'active pots'}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Solid White Action Button like Daily Cost card */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/goals/add');
          }}
          accessibilityRole="button"
          accessibilityLabel="Create pot"
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="plus" size={18} color={Brand.deep} />
            <ThemedText type="defaultBold" style={styles.addButtonText}>Add pot</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function getReminderCategoryIcon(category: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Bills':
    case 'Utilities':
      return 'flash';
    case 'Rent':
      return 'home';
    case 'EMI':
    case 'Loan':
      return 'bank';
    case 'Credit Card':
      return 'credit-card';
    case 'Subscription':
      return 'repeat';
    case 'Insurance':
      return 'shield-check';
    default:
      return 'calendar-clock';
  }
}

function UpcomingBillsWidget({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { reminders } = useFinancialReminders();
  const theme = useTheme();

  const activeReminders = reminders
    .filter((r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped')
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  const upcomingList = activeReminders.slice(0, 3);
  const overdueCount = activeReminders.filter((r) => r.derivedStatus === 'overdue').length;
  const totalAmountDue = activeReminders.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const safeFormat = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <Card style={styles.billsWidgetCard}>
      {/* Header */}
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.accent} />
            <ThemedText type="defaultBold">Bills & Reminders</ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            Upcoming payments & utility alerts
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/bills');
          }}
          accessibilityRole="button"
          hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            View all →
          </ThemedText>
        </Pressable>
      </View>

      {/* Summary KPI Bar */}
      {activeReminders.length > 0 && (
        <View style={[styles.billsKpiBar, { backgroundColor: theme.cardMuted }]}>
          <View style={styles.kpiItem}>
            <ThemedText type="caption" themeColor="textSecondary">
              PENDING
            </ThemedText>
            <ThemedText type="smallBold">
              {activeReminders.length} {activeReminders.length === 1 ? 'bill' : 'bills'}
            </ThemedText>
          </View>

          <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />

          <View style={styles.kpiItem}>
            <ThemedText type="caption" themeColor="textSecondary">
              TOTAL DUE
            </ThemedText>
            <ThemedText type="smallBold">
              {formatAmount(totalAmountDue)}
            </ThemedText>
          </View>

          {overdueCount > 0 && (
            <>
              <View style={[styles.kpiDivider, { backgroundColor: theme.border }]} />
              <View style={styles.kpiItem}>
                <ThemedText type="caption" style={{ color: theme.danger }}>
                  OVERDUE
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.danger }}>
                  {overdueCount} {overdueCount === 1 ? 'bill' : 'bills'}
                </ThemedText>
              </View>
            </>
          )}
        </View>
      )}

      {/* Subscriptions Hub Quick Link */}
      <Pressable
        onPress={() => {
          triggerHaptic();
          router.push('/subscriptions');
        }}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.subHubLinkRow,
          { backgroundColor: theme.cardMuted },
          pressed && styles.pressed,
        ]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MaterialCommunityIcons name="repeat" size={16} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Subscriptions & Recurring Hub</ThemedText>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
      </Pressable>

      {/* Reminders List or Empty State */}
      {activeReminders.length === 0 ? (
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/bills/add');
          }}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.budgetEmpty,
            { backgroundColor: theme.cardMuted },
            pressed && styles.pressed,
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="plus" size={16} color={theme.accent} />
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              Add your first bill or reminder
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            Never miss rent, utility bills, or subscription renewals.
          </ThemedText>
        </Pressable>
      ) : (
        <View style={styles.billsList}>
          {upcomingList.map((rem) => {
            const isOverdue = rem.derivedStatus === 'overdue';
            const isDueToday = rem.derivedStatus === 'due_today';
            const color = isOverdue ? theme.danger : isDueToday ? '#BD7119' : theme.accent;
            const statusText = isOverdue
              ? `${Math.abs(rem.daysUntilDue)}d overdue`
              : isDueToday
                ? 'Due today'
                : `In ${rem.daysUntilDue}d`;
            const iconName = getReminderCategoryIcon(rem.category);

            return (
              <Pressable
                key={rem.id}
                onPress={() => {
                  triggerHaptic();
                  router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                }}
                accessibilityRole="button"
                accessibilityLabel={`Pay ${rem.title}`}
                style={({ pressed }) => [
                  styles.billWidgetRow,
                  { backgroundColor: theme.cardMuted },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.billIconBadge, { backgroundColor: `${color}1E` }]}>
                  <MaterialCommunityIcons name={iconName} size={18} color={color} />
                </View>
                <View style={styles.billWidgetCopy}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {rem.title}
                  </ThemedText>
                  <ThemedText type="caption" style={{ color }}>
                    {statusText} · {rem.category}
                  </ThemedText>
                </View>
                <View style={styles.billRightAction}>
                  <ThemedText type="smallBold" style={{ color }}>
                    {safeFormat(rem.amount)}
                  </ThemedText>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </Card>
  );
}

function MoneyOverview({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { debts } = useDebts();
  const { youAreOwed, youOwe, net } = summarizeDebts(debts);
  const openDebtCount = debts.filter((debt) => getRemainingBalance(debt) > 0).length;

  return (
    <View style={styles.heroCardSummary}>
      {/* Spendly Brand Ambient Background Orbs */}
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />

      <View style={styles.heroContent}>
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/debts');
          }}
          accessibilityRole="button"
          accessibilityLabel={`Lend and borrow. Net ${formatAmount(net)}. Owed to you ${formatAmount(youAreOwed)}. You owe ${formatAmount(youOwe)}. ${openDebtCount} open.`}
          accessibilityHint="Opens the debts and IOUs page"
          style={({ pressed }) => [styles.cardPressArea, pressed && styles.cardPressed]}>
          {/* Header Topline */}
          <View style={styles.heroTopline}>
            <ThemedText type="caption" style={styles.heroLabel}>
              LEND & BORROW
            </ThemedText>
            <View style={styles.monthPill}>
              <ThemedText type="caption" style={styles.monthPillText}>{openDebtCount} open</ThemedText>
            </View>
          </View>

          {/* Hero Net Value - Pure White like Daily Cost card */}
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {net === 0 ? formatAmount(0) : net > 0 ? `+${formatAmount(net)}` : formatAmount(net)}
          </ThemedText>

          {/* Footer Metrics Row with Clean White Style */}
          <View style={styles.footerRow}>
            <View style={styles.metricsPillsRow}>
              <View style={[styles.whiteChip, styles.shrinkChip]}>
                <View style={styles.greenDot} />
                <ThemedText
                  type="small"
                  style={styles.chipText}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  Owed: {formatAmount(youAreOwed)}
                </ThemedText>
              </View>
              <View style={[styles.whiteChip, styles.shrinkChip]}>
                <View style={styles.redDot} />
                <ThemedText
                  type="small"
                  style={styles.chipText}
                  numberOfLines={1}
                  adjustsFontSizeToFit>
                  Owe: {formatAmount(youOwe)}
                </ThemedText>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Solid White Action Button like Daily Cost card */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/debts/add');
          }}
          accessibilityRole="button"
          accessibilityLabel="Add debt"
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="plus" size={18} color={Brand.deep} />
            <ThemedText type="defaultBold" style={styles.addButtonText}>Add debt</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function SpendingAdvisor({
  expenses,
  limits,
  formatAmount,
  now,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
  now: Date;
}) {
  const theme = useTheme();
  const allInsights = getBudgetInsights(expenses, limits, now, now);
  const insights = allInsights.slice(0, 2);
  const hasLimits = Object.keys(limits).length > 0;

  return (
    <Card style={styles.advisorCard}>
      <View style={styles.advisorHeading}>
        <View style={styles.advisorIcon}><MaterialCommunityIcons name="creation" size={18} color={theme.accent} /></View>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Spending advisor</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A helpful check-in for this month</ThemedText>
        </View>
        {allInsights.length > 0 && (
          <View style={[styles.noticeCount, { backgroundColor: theme.accentMuted }]}>
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>{allInsights.length}</ThemedText>
          </View>
        )}
      </View>

      {!hasLimits ? (
        <ThemedText type="small" themeColor="textSecondary">
          Set a category limit to get early heads-ups before you go over.
        </ThemedText>
      ) : insights.length === 0 ? (
        <View style={styles.advisorStatus}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#21835B" />
            <ThemedText type="smallBold" style={{ color: '#21835B' }}>You’re on track</ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">All category limits are currently below the heads-up point.</ThemedText>
        </View>
      ) : (
        <View style={styles.insightList}>
          {insights.map((insight) => <InsightLine key={insight.category} insight={insight} formatAmount={formatAmount} />)}
          {allInsights.length > insights.length && (
            <ThemedText type="caption" themeColor="textSecondary">
              + {allInsights.length - insights.length} more {allInsights.length - insights.length === 1 ? 'notice' : 'notices'} in your advisor.
            </ThemedText>
          )}
        </View>
      )}

      <View style={[styles.advisorActions, { borderTopColor: theme.border }]}>
        <Pressable onPress={() => router.push('/advisor')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Open advisor →</ThemedText>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => router.push('/(tabs)/reports')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Monthly report ↗</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

function InsightLine({ insight, formatAmount }: { insight: BudgetInsight; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const isOver = insight.level === 'over';
  const color = isOver ? theme.danger : insight.level === 'near' ? '#BD7119' : theme.accent;
  const title = insight.level === 'over'
    ? `${insight.category} is over its limit`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? `${insight.category} limit reached` : `${insight.category} is close to its limit`
      : `${insight.category} is trending over budget`;
  const detail = insight.level === 'over'
    ? `${formatAmount(Math.abs(insight.remaining))} over this month’s limit.`
    : insight.level === 'near'
      ? insight.remaining <= 0 ? 'No budget left in this category this month.' : `${formatAmount(insight.remaining)} left · ${Math.round(insight.percentUsed * 100)}% used.`
      : `At this pace, spending may reach ${formatAmount(insight.projectedSpend)} this month.`;

  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightMarker, { backgroundColor: color }]} />
      <View style={styles.insightCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const { expenses, profile, categoryLimits, formatAmount, categoryIcons, firstDayOfWeek, hasCompletedOnboarding, setHasCompletedOnboarding, isLoading } = useExpenses();
  const { incomeList } = useIncome();
  const theme = useTheme();
  const now = useNow(60_000);
  const monthSpend = totalForMonth(expenses, now);
  const recent = sortByDateDesc(expenses).slice(0, RECENT_LIMIT);

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');
  const availableCategories = ['All', ...new Set(expenses.map((e) => e.category))];
  const filteredRecent = (selectedFilterCategory === 'All'
    ? recent
    : expenses.filter((e) => e.category === selectedFilterCategory)
  ).slice(0, RECENT_LIMIT);

  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthSpend = totalForMonth(expenses, lastMonth);
  const diffAmount = monthSpend - lastMonthSpend;
  const diffPercent = lastMonthSpend > 0 ? Math.round((Math.abs(diffAmount) / lastMonthSpend) * 100) : 0;

  const costSummaries = buildCostSummaries(expenses, now, firstDayOfWeek).map((summary) =>
    summary.period === 'monthly' && lastMonthSpend > 0
      ? {
          ...summary,
          detail: `${summary.detail} ${diffAmount <= 0 ? '↓' : '↑'} ${diffPercent}% vs last month.`,
        }
      : summary
  );

  const categoryBreakdowns = buildCategoryBreakdowns(expenses, now, firstDayOfWeek);

  const openCostReport = (period: SummaryPeriod) => {
    triggerHaptic();
    if (period === 'daily') {
      router.push('/daily-report');
      return;
    }
    if (period === 'yesterday') {
      router.push({ pathname: '/daily-report', params: { date: getAddExpenseDate('yesterday', now) } });
      return;
    }
    if (period === 'monthly') {
      router.push('/(tabs)/reports');
      return;
    }
    router.push({ pathname: '/period-report', params: { period } } as any);
  };

  const cashFlow = calculateMonthlyCashFlow({ incomeList, expenses, month: now });
  const [cashFlowCardIndex, setCashFlowCardIndex] = useState(0);
  const screenWidth = useWindowDimensions().width;
  const containerPadding = Spacing.four * 2;
  const cardWidth = Math.min(screenWidth - containerPadding, MaxContentWidth - containerPadding);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.contentContainer, { paddingTop: 0 }]}
      showsVerticalScrollIndicator={false}>
      {/* Facebook Mobile Cover Header taking full top space */}
      <FacebookCoverHeader
        profile={profile}
        totalBalance={incomeList.reduce((acc, i) => acc + i.amount, 0) - sumAmounts(expenses)}
        monthlySpent={monthSpend}
      />

      <View style={styles.container}>

        {/* Swipeable Summary Cards Carousel */}
        <CostSummaryCarousel
          summaries={costSummaries}
          breakdowns={categoryBreakdowns}
          formatAmount={formatAmount}
          categoryIcons={categoryIcons}
          onOpenReport={openCostReport}
          onAddExpense={() => {
            triggerHaptic();
            router.push('/add-expense');
          }}
        />

        {/* Tier 2: Actionable Alerts & Secondary Swipeable Carousel (Cash Flow ⇄ Money Overview) */}
        <UpcomingBillsWidget formatAmount={formatAmount} />
        <SpendingAdvisor expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} now={now} />

        <View style={styles.carouselWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={cardWidth + Spacing.three}
            decelerationRate="fast"
            onScroll={(e) => {
              const offsetX = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offsetX / (cardWidth + Spacing.three));
              if (newIndex !== cashFlowCardIndex && newIndex >= 0 && newIndex <= 2) {
                setCashFlowCardIndex(newIndex);
                triggerHaptic();
              }
            }}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContent}>

            {/* Card A: Monthly Cash Flow */}
            <View style={[styles.carouselCard, { width: cardWidth }]}>
              <MoneySummaryCard
                moneyIn={cashFlow.moneyIn}
                moneyOut={cashFlow.moneyOut}
                net={cashFlow.net}
                formatAmount={formatAmount}
              />
            </View>

            {/* Card B: Money Overview (Debts) */}
            <View style={[styles.carouselCard, { width: cardWidth }]}>
              <MoneyOverview formatAmount={formatAmount} />
            </View>

            {/* Card C: Money Plan & Pots */}
            <View style={[styles.carouselCard, { width: cardWidth }]}>
              <MoneyPlanSummaryCard formatAmount={formatAmount} />
            </View>

          </ScrollView>

          {/* Pagination Dots (3 dots) */}
          <View style={styles.paginationDots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: cashFlowCardIndex === i ? theme.accent : theme.border,
                    width: cashFlowCardIndex === i ? 22 : 6,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        <WeeklySpending expenses={expenses} today={now} firstDayOfWeek={firstDayOfWeek} formatAmount={formatAmount} />

        {/* Tier 3: High-Frequency Recent Activity Log (Promoted Up for 1-Swipe Access!) */}
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="defaultBold">Recent activity</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Your latest transactions</ThemedText>
          </View>
          {expenses.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                triggerHaptic();
                router.push('/(tabs)/expenses');
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>See all →</ThemedText>
            </Pressable>
          )}
        </View>

        {expenses.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipScroll}>
            {availableCategories.slice(0, 6).map((cat) => {
              const selected = selectedFilterCategory === cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedFilterCategory(cat);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected ? theme.accentFill : theme.cardMuted,
                      borderColor: selected ? theme.accentFill : theme.border,
                    },
                  ]}>
                  <ThemedText type="caption" style={{ color: selected ? theme.onBrand : theme.textSecondary, fontWeight: '700' }}>
                    {cat}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <Card padded={false}>
          {filteredRecent.length === 0 ? (
            <EmptyState
              title="No transactions"
              message={selectedFilterCategory === 'All' ? "Add your first expense and it will show up here." : `No expenses found in "${selectedFilterCategory}".`}
              tone={theme.accent}
            />
          ) : (
            filteredRecent.map((expense, index) => (
              <View key={expense.id}>
                {index > 0 && <CardDivider />}
                <ExpenseListItem expense={expense} />
              </View>
            ))
          )}
        </Card>

        {/* Footer & Support */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/about');
          }}
          accessibilityRole="button"
          accessibilityLabel="About CashTrack and support"
          style={({ pressed }) => [
            styles.compactSupportCard,
            { backgroundColor: theme.cardMuted, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'nowrap' }}>
            <MaterialCommunityIcons name="heart" size={16} color="#EB5757" />
            <ThemedText type="smallBold" numberOfLines={1}>About CashTrack & Support</ThemedText>
          </View>
        </Pressable>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.footer}>
          Small steps make a clearer picture.
        </ThemedText>
      </View>
      <OnboardingModal
        visible={!hasCompletedOnboarding && !isLoading}
        onClose={() => setHasCompletedOnboarding(true)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.four },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.four,
  },
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  greetingCopy: {
    gap: 2,
  },
  greetingTitle: {
    fontSize: 22,
    lineHeight: 28,
  },
  themeToggleButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    flex: 1,
    justifyContent: 'space-between',
    zIndex: 1,
  },
  cardPressArea: {
    gap: Spacing.three,
  },
  cardPressed: {
    opacity: 0.9,
  },
  heroTopline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  monthPill: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  monthPillText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 46,
    fontVariant: ['tabular-nums'],
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.one,
  },
  addButtonText: {
    color: Brand.deep,
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -100,
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
  planCard: { gap: 0, padding: Spacing.three },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  planCopy: { flex: 1, gap: 2 },
  planBtn: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Radius.pill },
  summaryRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metricCard: {
    flex: 1,
    gap: Spacing.one,
  },
  metricIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.small,
  },
  metricValue: {
    fontSize: 18,
    lineHeight: 24,
    fontVariant: ['tabular-nums'],
  },
  filterChipScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.half,
  },
  filterChip: {
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moneyOverviewCard: {
    height: 215,
    justifyContent: 'space-between',
    padding: Spacing.four,
  },
  stylishCard: {
    height: 215,
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
  },
  topAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    alignItems: 'center',
  },
  accentPill: {
    width: 40,
    height: 4,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  titleCopy: {
    gap: 2,
  },
  heroCardSummary: {
    height: 215,
    backgroundColor: Brand.deep, // Signature Spendly Deep Navy Blue (#00109D)
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  whitePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  metricsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  moneyInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  moneyOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Radius.small,
    borderWidth: 1,
    borderColor: 'rgba(248, 113, 113, 0.35)',
  },
  moneyInBadgeText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  subHubLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
  },
  moneyOutBadgeText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '700',
  },
  solidNetBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.medium,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    zIndex: 2,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  redDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F87171',
  },
  cyanDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },
  whiteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: Spacing.two,
    paddingVertical: 5,
    borderRadius: Radius.small,
  },
  shrinkChip: {
    flexShrink: 1,
  },
  chipText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  overviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  overviewBtnColored: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
  },
  carouselWrapper: {
    width: '100%',
  },
  carouselContent: {
    gap: Spacing.three,
  },
  carouselCard: {},
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  seeAll: {
    paddingVertical: 4,
  },
  footer: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
  compactSupportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekCard: {
    gap: Spacing.three,
  },
  billsWidgetCard: {
    gap: Spacing.two,
  },
  billsKpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
  },
  kpiItem: {
    alignItems: 'center',
    gap: 2,
  },
  kpiDivider: {
    width: StyleSheet.hairlineWidth,
    height: 24,
  },
  billsList: {
    gap: Spacing.two,
  },
  billWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.medium,
  },
  billIconBadge: {
    width: 32,
    height: 32,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billWidgetCopy: {
    flex: 1,
    gap: 2,
  },
  billRightAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weekTotalBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  selectedDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
    borderRadius: Radius.medium,
    marginTop: Spacing.one,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCopy: {
    gap: 2,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 100,
    paddingTop: Spacing.two,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    width: 20,
    alignItems: 'center',
  },
  bar: {
    width: 14,
    borderRadius: Radius.small,
  },
  todayLabel: {
    fontWeight: '700',
  },
  budgetCard: {
    gap: Spacing.three,
  },
  budgetEmpty: {
    padding: Spacing.three,
    borderRadius: Radius.medium,
    alignItems: 'center',
    gap: 2,
  },
  budgetRow: {
    gap: 6,
  },
  budgetLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  budgetDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    marginRight: 6,
  },
  budgetCategory: {
    flex: 1,
  },
  budgetTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  advisorCard: {
    gap: Spacing.three,
  },
  advisorHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  advisorIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(139,123,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  advisorStatus: {
    gap: 2,
  },
  insightList: {
    gap: Spacing.two,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  insightMarker: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
    marginTop: 6,
  },
  insightCopy: {
    flex: 1,
    gap: 2,
  },
  advisorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
  },
  advisorAction: {
    flex: 1,
    alignItems: 'center',
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
  },
  pressed: {
    opacity: 0.75,
  },
});
