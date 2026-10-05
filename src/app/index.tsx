import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Card, CardDivider } from '@/components/card';
import { CategoryBreakdown } from '@/components/category-breakdown';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { MoneySummaryCard } from '@/components/money-summary-card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useDebts } from '@/context/debt-context';
import { useIncome } from '@/context/income-context';
import { useGoals } from '@/context/goal-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useTheme } from '@/hooks/use-theme';
import { sortByDateDesc, sumAmounts, totalForDate, totalForMonth } from '@/utils/expense';
import { calculateMonthlyCashFlow } from '@/utils/income';
import type { Expense } from '@/types/expense';
import { getBudgetInsights, type BudgetInsight } from '@/utils/advisor';

const RECENT_LIMIT = 5;

type DaySpend = {
  date: Date;
  label: string;
  amount: number;
};

function getWeekSpending(expenses: Expense[], today: Date): DaySpend[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));
    date.setHours(12, 0, 0, 0);
    return {
      date,
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
      amount: totalForDate(expenses, date),
    };
  });
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function WeeklySpending({ expenses, today, formatAmount }: { expenses: Expense[]; today: Date; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const days = getWeekSpending(expenses, today);
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

function BudgetOverview({
  expenses,
  limits,
  formatAmount,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const entries = Object.entries(limits).sort(([first], [second]) => first.localeCompare(second));

  return (
    <Card style={styles.budgetCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Category limits</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Monthly guardrails</ThemedText>
        </View>
        <Pressable onPress={() => router.push('/budgets')} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Manage  →</ThemedText>
        </Pressable>
      </View>
      {entries.length === 0 ? (
        <Pressable
          onPress={() => router.push('/budgets')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.budgetEmpty, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>＋  Set your first category limit</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">A little structure can make spending clearer.</ThemedText>
        </Pressable>
      ) : (
        entries.slice(0, 3).map(([category, limit]) => {
          const now = new Date();
          const spent = sumAmounts(expenses.filter((expense) => {
            const date = new Date(expense.date);
            return expense.category === category && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }));
          const fraction = Math.min(spent / limit, 1);
          const over = spent > limit;
          const accent = over ? theme.danger : getCategoryColor(category);
          return (
            <View key={category} style={styles.budgetRow}>
              <View style={styles.budgetLabelRow}>
                <View style={[styles.budgetDot, { backgroundColor: accent }]} />
                <ThemedText type="smallBold" style={styles.budgetCategory}>{category}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {formatAmount(spent)} / {formatAmount(limit)}
                </ThemedText>
              </View>
              <View style={[styles.budgetTrack, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.budgetFill, { width: `${fraction * 100}%`, backgroundColor: accent }]} />
              </View>
              <ThemedText type="caption" themeColor={over ? 'danger' : 'textSecondary'}>
                {over ? `${formatAmount(spent - limit)} over limit` : `${formatAmount(limit - spent)} left`}
              </ThemedText>
            </View>
          );
        })
      )}
    </Card>
  );
}

function MoneyPlanSummaryCard({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { goals } = useGoals();
  const theme = useTheme();
  const activeGoals = goals.filter((g) => !g.isCompleted);
  const totalSaved = goals.reduce((sum, g) => sum + g.contributedAmount, 0);

  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.planCopy}>
          <ThemedText type="defaultBold">Money Plan & Pots</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {activeGoals.length} active {activeGoals.length === 1 ? 'pot' : 'pots'} · {formatAmount(totalSaved)} saved
          </ThemedText>
        </View>
        <Pressable
          onPress={() => router.push('/goals')}
          accessibilityRole="button"
          accessibilityLabel="View money plan"
          style={({ pressed }) => [styles.planBtn, { backgroundColor: theme.accentMuted }, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Plan  →</ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

function UpcomingBillsWidget({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { reminders } = useFinancialReminders();
  const theme = useTheme();

  const activeReminders = reminders
    .filter((r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped')
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 3);

  if (activeReminders.length === 0) return null;

  const safeFormat = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <Card style={styles.billsWidgetCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">Upcoming bills</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Payments requiring your attention</ThemedText>
        </View>
        <Pressable onPress={() => router.push('/bills' as any)} accessibilityRole="button" hitSlop={8}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>View all →</ThemedText>
        </Pressable>
      </View>

      <View style={styles.billsList}>
        {activeReminders.map((rem) => {
          const isOverdue = rem.derivedStatus === 'overdue';
          const isDueToday = rem.derivedStatus === 'due_today';
          const color = isOverdue ? theme.danger : isDueToday ? '#BD7119' : theme.accent;
          const statusText = isOverdue ? `${Math.abs(rem.daysUntilDue)}d overdue` : isDueToday ? 'Due today' : `In ${rem.daysUntilDue}d`;

          return (
            <Pressable
              key={rem.id}
              onPress={() => router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } })}
              style={({ pressed }) => [styles.billWidgetRow, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
              <View style={[styles.billDot, { backgroundColor: color }]} />
              <View style={styles.billWidgetCopy}>
                <ThemedText type="smallBold" numberOfLines={1}>{rem.title}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">{statusText}</ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color }}>
                {safeFormat(rem.amount)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function MoneyOverview({ formatAmount }: { formatAmount: (amount: number) => string }) {
  const { debts } = useDebts();
  const activeDebts = debts.filter((d) => d.status === 'active');
  const youAreOwed = activeDebts.filter((d) => d.type === 'lent').reduce((sum, d) => sum + d.amount, 0);
  const youOwe = activeDebts.filter((d) => d.type === 'borrowed').reduce((sum, d) => sum + d.amount, 0);
  const net = youAreOwed - youOwe;

  return (
    <View style={styles.heroCard}>
      <View style={styles.heroContent}>
        <View style={styles.heroTopline}>
          <ThemedText type="caption" style={styles.heroLabel}>MONEY OVERVIEW</ThemedText>
          <Pressable
            onPress={() => router.push('/debts/add')}
            accessibilityRole="button"
            accessibilityLabel="Add debt"
            style={({ pressed }) => [styles.heroAddButton, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" style={styles.heroAddButtonText}>＋ Add debt</ThemedText>
          </Pressable>
        </View>

        <View style={styles.heroSummaryRow}>
          <View style={styles.heroStat}>
            <ThemedText type="caption" style={styles.heroStatLabel}>YOU ARE OWED</ThemedText>
            <ThemedText type="subtitle" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(youAreOwed)}
            </ThemedText>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroStat}>
            <ThemedText type="caption" style={styles.heroStatLabel}>YOU OWE</ThemedText>
            <ThemedText type="subtitle" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(youOwe)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.heroNetRow}>
          <ThemedText type="small" style={styles.heroNetText}>
            Net Position: <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>{net >= 0 ? `+${formatAmount(net)} (Credit)` : `${formatAmount(net)} (Debit)`}</ThemedText>
          </ThemedText>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/debts')}
        accessibilityRole="button"
        accessibilityLabel="View debts"
        style={({ pressed }) => [styles.heroBottomAction, pressed && styles.pressed]}>
        <ThemedText type="smallBold" style={styles.heroBottomActionText}>View debts  →</ThemedText>
      </Pressable>
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />
    </View>
  );
}

function SpendingAdvisor({
  expenses,
  limits,
  formatAmount,
}: {
  expenses: Expense[];
  limits: Record<string, number>;
  formatAmount: (amount: number) => string;
}) {
  const theme = useTheme();
  const allInsights = getBudgetInsights(expenses, limits);
  const insights = allInsights.slice(0, 2);
  const hasLimits = Object.keys(limits).length > 0;

  return (
    <Card style={styles.advisorCard}>
      <View style={styles.advisorHeading}>
        <View style={styles.advisorIcon}><ThemedText type="defaultBold" style={{ color: theme.accent }}>✦</ThemedText></View>
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
          <ThemedText type="smallBold" style={{ color: '#21835B' }}>✓  You’re on track</ThemedText>
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
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Open advisor  →</ThemedText>
        </Pressable>
        <View style={[styles.actionDivider, { backgroundColor: theme.border }]} />
        <Pressable onPress={() => router.push('/reports')} accessibilityRole="button" style={({ pressed }) => [styles.advisorAction, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>Monthly report  ↗</ThemedText>
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

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

export default function DashboardScreen() {
  const { expenses, profile, categoryLimits, formatAmount, hasCompletedOnboarding, setHasCompletedOnboarding, isLoading } = useExpenses();
  const { incomeList } = useIncome();
  const theme = useTheme();
  const now = new Date();
  const monthSpend = totalForMonth(expenses, now);
  const todaySpend = totalForDate(expenses, now);
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

  const todayExpenseCount = expenses.filter((expense) => {
    const date = new Date(expense.date);
    return (
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }).length;
  const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'short', day: 'numeric', month: 'short' }).format(now);
  const cashFlow = calculateMonthlyCashFlow({ incomeList, expenses, month: now });

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={styles.greeting}>
          <View style={styles.greetingCopy}>
            <ThemedText type="subtitle" style={styles.greetingTitle}>
              {getGreeting(now.getHours())}{profile.name.trim() ? `, ${profile.name.trim().split(/\s+/)[0]}` : ''}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(now)}
            </ThemedText>
          </View>
        </View>

        <ThemedView type="card" style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>DAILY SPENDING</ThemedText>
              <View style={styles.monthPill}>
                <ThemedText type="caption" style={styles.monthPillText}>{todayLabel}</ThemedText>
              </View>
            </View>
            <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(todaySpend)}
            </ThemedText>
            <ThemedText type="small" style={styles.heroSubtext}>
              {todayExpenseCount === 0
                ? 'No expenses recorded today. Add your first.'
                : `${todayExpenseCount} ${todayExpenseCount === 1 ? 'expense' : 'expenses'} recorded today`}
            </ThemedText>
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push('/add-expense');
              }}
              accessibilityRole="button"
              accessibilityLabel="Add an expense"
              style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
              <ThemedText type="defaultBold" style={styles.addButtonText}>＋  Add expense</ThemedText>
            </Pressable>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </ThemedView>

        <MoneySummaryCard
          moneyIn={cashFlow.moneyIn}
          moneyOut={cashFlow.moneyOut}
          net={cashFlow.net}
          formatAmount={formatAmount}
        />

        <MoneyPlanSummaryCard formatAmount={formatAmount} />
        <UpcomingBillsWidget formatAmount={formatAmount} />

        <View style={styles.summaryRow}>
          <Card style={styles.metricCard}>
            <View style={styles.metricHeaderRow}>
              <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>↓</ThemedText>
              </View>
              {lastMonthSpend > 0 && (
                <View style={[styles.trendBadge, { backgroundColor: diffAmount <= 0 ? 'rgba(39, 174, 96, 0.15)' : 'rgba(235, 87, 87, 0.15)' }]}>
                  <ThemedText type="caption" style={{ color: diffAmount <= 0 ? '#27AE60' : theme.danger, fontWeight: '700', fontSize: 10 }}>
                    {diffAmount <= 0 ? `↓ ${diffPercent}%` : `↑ ${diffPercent}%`}
                  </ThemedText>
                </View>
              )}
            </View>
            <ThemedText type="caption" themeColor="textSecondary">MONTHLY SPENDING</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(monthSpend)}
            </ThemedText>
          </Card>
          <Card style={styles.metricCard}>
            <View style={[styles.metricIcon, { backgroundColor: theme.accentMuted }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>#</ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">ALL TIME</ThemedText>
            <ThemedText type="defaultBold" style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(sumAmounts(expenses))}
            </ThemedText>
          </Card>
        </View>

        <MoneyOverview formatAmount={formatAmount} />
        <SpendingAdvisor expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} />
        <WeeklySpending expenses={expenses} today={now} formatAmount={formatAmount} />
        <CategoryBreakdown expenses={expenses} formatAmount={formatAmount} />
        <BudgetOverview expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} />

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
                router.push('/expenses');
              }}
              hitSlop={10}
              style={({ pressed }) => [styles.seeAll, pressed && styles.pressed]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>See all  →</ThemedText>
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
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor: selected ? theme.accent : theme.cardMuted,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                  ]}>
                  <ThemedText type="caption" style={{ color: selected ? '#FFFFFF' : theme.textSecondary, fontWeight: '700' }}>
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
          <ThemedText type="smallBold">♥  About CashTrack & Support</ThemedText>
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
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
  },
  heroContent: {
    gap: Spacing.one,
    zIndex: 1,
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
  heroSubtext: {
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.one,
  },
  addButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    minHeight: 44,
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
    height: 32,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    position: 'relative',
    gap: Spacing.three,
  },
  heroSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  heroStat: {
    flex: 1,
    gap: 2,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  heroStatVal: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  heroNetRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.15)',
    paddingTop: Spacing.two,
  },
  heroNetText: {
    color: 'rgba(255,255,255,0.8)',
  },
  heroAddButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  heroAddButtonText: {
    color: Brand.deep,
  },
  heroBottomAction: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: Radius.medium,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBottomActionText: {
    color: '#FFFFFF',
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
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  weekCard: {
    gap: Spacing.three,
  },
  billsWidgetCard: {
    gap: Spacing.three,
  },
  billsList: {
    gap: Spacing.two,
  },
  billWidgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  billDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  billWidgetCopy: {
    flex: 1,
    gap: 2,
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
