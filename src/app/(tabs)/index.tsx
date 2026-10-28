import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { MoneySummaryCard } from '@/components/dashboard/money-summary-card';
import { SummaryHeroCard } from '@/components/dashboard/summary-hero-card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
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
import { getReminderRemainingAmount } from '@/utils/reminder-payment';
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
  const activeDaysCount = days.filter((day) => day.amount > 0).length;

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
            {selectedDay ? (selectedDay.amount > 0 ? `Spent ${formatAmount(selectedDay.amount)}` : 'No expenses recorded') : `Daily avg: ${formatAmount(dailyAvg)} · ${activeDaysCount}/7 active days`}
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
          const barHeight = day.amount > 0 ? Math.max(10, (day.amount / maxAmount) * 78) : 6;
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
              <View style={[styles.barTrack, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isSelected ? theme.text : isToday ? theme.accent : day.amount > 0 ? theme.accent : theme.border,
                      opacity: day.amount > 0 ? 1 : 0.35,
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
  const potCountLabel = `${activeGoals.length} active ${activeGoals.length === 1 ? 'pot' : 'pots'}`;

  return (
    <SummaryHeroCard
      title="MONEY PLAN & POTS"
      pill={`${overallProgress}% saved`}
      amount={totalSaved}
      formatAmount={formatAmount}
      chips={[
        { label: potCountLabel, tone: 'info' },
        { label: `of ${formatAmount(totalTarget)}`, tone: 'info' },
      ]}
      onPress={() => router.push('/goals')}
      accessibilityLabel={`Money plan and pots. ${formatAmount(totalSaved)} saved of ${formatAmount(totalTarget)}. ${potCountLabel}. ${overallProgress}% saved.`}
      accessibilityHint="Opens the savings goals and pots page"
      actionLabel="Add pot"
      onActionPress={() => router.push('/goals/add')}
    />
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

function getReminderCategoryColor(
  category: string,
  isOverdue: boolean,
  isDueToday: boolean,
  theme: ReturnType<typeof useTheme>
): string {
  if (isOverdue) return '#E11D48';
  if (isDueToday) return '#D97706';
  switch (category) {
    case 'Rent':
      return '#2563EB';
    case 'Bills':
    case 'Utilities':
      return '#0284C7';
    case 'EMI':
    case 'Loan':
    case 'Credit Card':
      return '#7C3AED';
    case 'Subscription':
      return '#059669';
    case 'Insurance':
      return '#0891B2';
    default:
      return theme.accent;
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
  const totalAmountDue = activeReminders.reduce((sum, r) => sum + (getReminderRemainingAmount(r) ?? 0), 0);
  const nextReminder = activeReminders[0];

  const safeFormat = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <View style={styles.billsWidgetContainer}>
      {/* SECTION 1: GLASSMOURPHIC SUMMARY HERO BANNER (TOP) */}
      <View style={[styles.billsHeroCard, overdueCount > 0 && styles.billsHeroCardAlert]}>
        <View pointerEvents="none" style={styles.heroOrbLarge} />
        <View pointerEvents="none" style={styles.heroOrbSmall} />
        {overdueCount > 0 && <View pointerEvents="none" style={styles.heroOrbRedAlert} />}

        <View style={styles.billsHeroContent}>
          {/* Top Eyebrow & View All Link */}
          <View style={styles.billsHeroHeader}>
            <View style={styles.billsHeroTitleGroup}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color="#14E7FD" />
              <Text style={styles.billsHeroEyebrow}>BILLS & REMINDERS</Text>
            </View>

            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/bills');
              }}
              accessibilityRole="button"
              accessibilityLabel="View all bills and reminders"
              hitSlop={8}
              style={({ pressed }) => [styles.viewAllGlassLink, pressed && styles.pressed]}>
              <Text style={styles.viewAllGlassText}>View all →</Text>
            </Pressable>
          </View>

          {/* Hero Total Due & Overdue Alert Row */}
          <View style={styles.billsHeroMetrics}>
            <View style={styles.heroTotalRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTotalLabel}>TOTAL AMOUNT DUE</Text>
                <Text style={styles.heroTotalValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
                  {formatAmount(totalAmountDue)}
                </Text>
              </View>
              {overdueCount > 0 && (
                <View style={styles.overdueGlassPill}>
                  <Text style={styles.overdueGlassText}>🚨 {overdueCount} OVERDUE</Text>
                </View>
              )}
            </View>

            {nextReminder ? (
              <View style={styles.nextDueRow}>
                <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.85)" />
                <Text style={styles.nextDueText} numberOfLines={1}>
                  Next: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>{nextReminder.title}</Text> · {
                    nextReminder.daysUntilDue < 0
                      ? `🚨 ${Math.abs(nextReminder.daysUntilDue)}d overdue`
                      : nextReminder.daysUntilDue === 0
                        ? 'Due today'
                        : `In ${nextReminder.daysUntilDue} day${nextReminder.daysUntilDue === 1 ? '' : 's'}`
                  }
                </Text>
              </View>
            ) : (
              <View style={styles.nextDueRow}>
                <Ionicons name="checkmark-circle-outline" size={14} color="#34D399" />
                <Text style={styles.nextDueText}>All upcoming bills caught up!</Text>
              </View>
            )}
          </View>

          {/* Subscriptions Hub Glass Bar */}
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/subscriptions');
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.subHubGlassBar, pressed && styles.pressed]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialCommunityIcons name="repeat" size={16} color="#14E7FD" />
              <Text style={styles.subHubGlassText}>Subscriptions & Recurring Hub</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={18} color="rgba(255,255,255,0.7)" />
          </Pressable>
        </View>
      </View>

      {/* SECTION 2: INTERACTIVE CATEGORIZED PAYMENT FEED (BOTTOM) */}
      <View style={styles.billsFeedSection}>
        <View style={styles.feedHeaderRow}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.feedTitle}>
            UPCOMING PAYMENTS ({activeReminders.length})
          </ThemedText>
          <Pressable
            onPress={() => {
              triggerHaptic();
              router.push('/bills/add');
            }}
            accessibilityRole="button"
            accessibilityLabel="Add new bill"
            hitSlop={8}
            style={({ pressed }) => [styles.quickAddPill, { backgroundColor: theme.cardMuted, borderColor: theme.border }, pressed && styles.pressed]}>
            <Ionicons name="add" size={14} color={theme.accent} />
            <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '700' }}>Add bill</ThemedText>
          </Pressable>
        </View>

        {activeReminders.length === 0 ? (
          <Card style={styles.emptyFeedCard}>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/bills/add');
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.emptyFeedButton, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="calendar-plus" size={32} color={theme.accent} />
              <View style={{ gap: 2, alignItems: 'center' }}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  No upcoming bills due
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
                  Tap to set up rent, utilities, or subscription reminders.
                </ThemedText>
              </View>
            </Pressable>
          </Card>
        ) : (
          <View style={styles.feedList}>
            {upcomingList.map((rem) => {
              const isOverdue = rem.derivedStatus === 'overdue';
              const isDueToday = rem.derivedStatus === 'due_today';
              const accentColor = getReminderCategoryColor(rem.category, isOverdue, isDueToday, theme);
              const iconName = getReminderCategoryIcon(rem.category);
              const remainingAmount = getReminderRemainingAmount(rem);
              const isPartiallyPaid =
                Math.max(0, rem.paidAmountCurrentCycle ?? 0) > 0 && (remainingAmount ?? 0) > 0;

              const statusText = isOverdue
                ? `${Math.abs(rem.daysUntilDue)}d overdue`
                : isDueToday
                  ? 'Due today'
                  : `In ${rem.daysUntilDue}d`;

              return (
                <Card key={rem.id} style={styles.feedItemCard} padded={false}>
                  <Pressable
                    onPress={() => {
                      triggerHaptic();
                      router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Pay ${rem.title}, ${safeFormat(isPartiallyPaid ? remainingAmount : rem.amount)}`}
                    style={({ pressed }) => [styles.feedItemRow, pressed && styles.pressed]}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${accentColor}1C` }]}>
                      <MaterialCommunityIcons name={iconName} size={20} color={accentColor} />
                    </View>

                    <View style={styles.feedItemCopy}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <ThemedText type="smallBold" numberOfLines={1} style={{ flexShrink: 1 }}>
                          {rem.title}
                        </ThemedText>
                        {isOverdue && (
                          <View style={styles.alertPillTag}>
                            <Text style={styles.alertPillText}>OVERDUE</Text>
                          </View>
                        )}
                      </View>
                      <ThemedText type="caption" style={{ color: isOverdue ? theme.danger : theme.textSecondary, fontSize: 11 }}>
                        <Text style={{ fontWeight: '700', color: accentColor }}>{statusText}</Text> · {rem.category}
                        {isPartiallyPaid ? ' · Part paid' : ''}
                      </ThemedText>
                    </View>

                    <View style={styles.feedRightCol}>
                      <ThemedText type="smallBold" style={[styles.feedAmount, { color: isOverdue ? theme.danger : theme.text }]}>
                        {safeFormat(isPartiallyPaid ? remainingAmount : rem.amount)}
                      </ThemedText>
                      <View style={[styles.payNowBtn, { backgroundColor: `${accentColor}18` }]}>
                        <MaterialCommunityIcons name="check-circle-outline" size={12} color={accentColor} />
                        <Text style={[styles.payNowText, { color: accentColor }]}>Pay</Text>
                      </View>
                    </View>
                  </Pressable>
                </Card>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

function MoneyOverview({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { debts } = useDebts();
  const { youAreOwed, youOwe, net } = summarizeDebts(debts);
  const openDebtCount = debts.filter((debt) => getRemainingBalance(debt) > 0).length;
  const netDescription =
    net > 0
      ? `Net owed to you ${formatAmount(net)}`
      : net < 0
        ? `Net you owe ${formatAmount(Math.abs(net))}`
        : `Net ${formatAmount(0)}`;

  return (
    <SummaryHeroCard
      title="LEND & BORROW"
      pill={`${openDebtCount} open`}
      amount={net}
      formatAmount={formatAmount}
      signed
      chips={[
        { label: `Owed: ${formatAmount(youAreOwed)}`, tone: 'positive' },
        { label: `Owe: ${formatAmount(youOwe)}`, tone: 'negative' },
      ]}
      onPress={() => router.push('/debts')}
      accessibilityLabel={`Lend and borrow. ${netDescription}. Owed to you ${formatAmount(youAreOwed)}. You owe ${formatAmount(youOwe)}. ${openDebtCount} open.`}
      accessibilityHint="Opens the debts and IOUs page"
      actionLabel="Add debt"
      onActionPress={() => router.push('/debts/add')}
    />
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
  const { expenses, isLoading } = useExpenses();
  const {
    profile,
    categoryLimits,
    formatAmount,
    categoryIcons,
    firstDayOfWeek,
    hasCompletedOnboarding,
    setHasCompletedOnboarding,
  } = usePreferences();
  const { incomeList } = useIncome();
  const theme = useTheme();
  const now = useNow(60_000);
  const monthSpend = totalForMonth(expenses, now);

  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('All');
  const availableCategories = ['All', ...new Set(expenses.map((e) => e.category))];
  const filteredRecent = sortByDateDesc(
    selectedFilterCategory === 'All'
      ? expenses
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

  const addExpenseForPeriod = (period: SummaryPeriod = 'daily') => {
    triggerHaptic();
    router.push({ pathname: '/add-expense', params: { date: getAddExpenseDate(period, now) } });
  };

  const cashFlow = calculateMonthlyCashFlow({ incomeList, expenses, month: now });
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(now);

  const summarySlides = [
    {
      key: 'cash-flow',
      label: 'monthly cash flow',
      content: (
        <MoneySummaryCard
          moneyIn={cashFlow.moneyIn}
          moneyOut={cashFlow.moneyOut}
          net={cashFlow.net}
          formatAmount={formatAmount}
          monthLabel={monthLabel}
        />
      ),
    },
    {
      key: 'lend-borrow',
      label: 'lend and borrow',
      content: <MoneyOverview formatAmount={formatAmount} />,
    },
    {
      key: 'money-plan',
      label: 'money plan and pots',
      content: <MoneyPlanSummaryCard formatAmount={formatAmount} />,
    },
  ];

  const [cashFlowCardIndex, setCashFlowCardIndex] = useState(0);
  const cashFlowIndexRef = useRef(0);
  const cashFlowScrollRef = useRef<ScrollView>(null);
  const screenWidth = useWindowDimensions().width;
  const containerPadding = Spacing.four * 2;
  const cardWidth = Math.min(screenWidth - containerPadding, MaxContentWidth - containerPadding);
  const snapInterval = cardWidth + Spacing.three;

  useEffect(() => {
    const timer = setTimeout(() => {
      cashFlowScrollRef.current?.scrollTo({
        x: snapInterval * cashFlowIndexRef.current,
        y: 0,
        animated: false,
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [snapInterval]);

  const goToSummarySlide = (index: number) => {
    cashFlowIndexRef.current = index;
    setCashFlowCardIndex(index);
    triggerHaptic();
    cashFlowScrollRef.current?.scrollTo({ x: snapInterval * index, y: 0, animated: true });
  };

  const handleSummaryScroll = (offsetX: number) => {
    const nextIndex = Math.round(offsetX / snapInterval);
    if (
      nextIndex >= 0
      && nextIndex < summarySlides.length
      && nextIndex !== cashFlowIndexRef.current
    ) {
      cashFlowIndexRef.current = nextIndex;
      setCashFlowCardIndex(nextIndex);
      triggerHaptic();
    }
  };

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
          onAddExpense={addExpenseForPeriod}
        />

        {/* Tier 2: Actionable Alerts & Secondary Swipeable Carousel (Cash Flow ⇄ Money Overview) */}
        <UpcomingBillsWidget formatAmount={formatAmount} />
        <SpendingAdvisor expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} now={now} />

        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="defaultBold">Money snapshot</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Cash flow, lending and pots
            </ThemedText>
          </View>
          <ThemedText type="caption" themeColor="textSecondary">
            Swipe →
          </ThemedText>
        </View>

        <View style={styles.carouselWrapper}>
          <ScrollView
            ref={cashFlowScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={snapInterval}
            decelerationRate="fast"
            onScroll={(event) => handleSummaryScroll(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
            contentContainerStyle={styles.carouselContent}>

            {summarySlides.map((slide) => (
              <View key={slide.key} style={[styles.carouselCard, { width: cardWidth }]}>
                {slide.content}
              </View>
            ))}

          </ScrollView>

          <View style={styles.paginationDots}>
            {summarySlides.map((slide, index) => (
              <Pressable
                key={slide.key}
                onPress={() => goToSummarySlide(index)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Go to ${slide.label} slide`}
                accessibilityState={{ selected: cashFlowCardIndex === index }}
                style={styles.dotButton}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor: cashFlowCardIndex === index ? theme.accent : theme.border,
                      width: cashFlowCardIndex === index ? 22 : 6,
                    },
                  ]}
                />
              </Pressable>
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
  whitePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
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
  dotButton: {
    alignItems: 'center',
    justifyContent: 'center',
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
  billsWidgetContainer: {
    gap: Spacing.three,
  },
  billsHeroCard: {
    backgroundColor: '#00109D',
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#00109D',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  billsHeroCardAlert: {
    borderColor: 'rgba(225, 29, 72, 0.45)',
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    right: -70,
    top: -80,
    backgroundColor: 'rgba(139, 123, 255, 0.22)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    left: -40,
    bottom: -50,
    backgroundColor: 'rgba(20, 231, 253, 0.2)',
  },
  heroOrbRedAlert: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    right: 10,
    top: -40,
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
  },
  billsHeroContent: {
    gap: Spacing.three,
    zIndex: 2,
  },
  billsHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  billsHeroTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  billsHeroEyebrow: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  billsHeroHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  overdueGlassPill: {
    backgroundColor: 'rgba(225, 29, 72, 0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(225, 29, 72, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  overdueGlassText: {
    color: '#FFD1D1',
    fontSize: 10,
    fontWeight: '800',
  },
  viewAllGlassLink: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  viewAllGlassText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  billsHeroMetrics: {
    gap: Spacing.one,
  },
  heroTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroTotalLabel: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroTotalValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    marginVertical: 2,
  },
  nextDueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.medium,
    alignSelf: 'flex-start',
    maxWidth: '100%',
  },
  nextDueText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  subHubGlassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: Spacing.three,
    height: 38,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  subHubGlassText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
  billsFeedSection: {
    gap: Spacing.two,
  },
  feedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  feedTitle: {
    letterSpacing: 0.8,
    fontSize: 10.5,
    fontWeight: '800',
  },
  quickAddPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  emptyFeedCard: {
    padding: Spacing.four,
  },
  emptyFeedButton: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  feedList: {
    gap: Spacing.two,
  },
  feedItemCard: {
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
  feedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  categoryBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedItemCopy: {
    flex: 1,
    gap: 2,
  },
  alertPillTag: {
    backgroundColor: '#E11D481C',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.small,
  },
  alertPillText: {
    color: '#E11D48',
    fontSize: 9,
    fontWeight: '800',
  },
  feedRightCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  feedAmount: {
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  payNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  payNowText: {
    fontSize: 11,
    fontWeight: '800',
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
    height: 116,
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
    width: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 2,
  },
  bar: {
    width: 16,
    borderRadius: Radius.pill,
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
