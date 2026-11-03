import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ExpenseListItem } from '@/components/expense-list-item';
import { MoneySummaryCard } from '@/components/dashboard/money-summary-card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { FeatureColors, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useIncome } from '@/context/income-context';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { sortByDateDesc, sumAmounts, totalForMonth } from '@/utils/expense';
import { calculateMonthlyCashFlow } from '@/utils/income';
import { FacebookCoverHeader } from '@/components/dashboard/facebook-cover-header';
import { CostSummaryCarousel } from '@/components/dashboard/cost-summary-carousel';
import { buildCategoryBreakdowns, buildCostSummaries, getAddExpenseDate, type SummaryPeriod } from '@/utils/period-summary';
import { WeeklySpending } from '@/components/dashboard/weekly-spending';
import { MoneyOverview, MoneyPlanSummaryCard } from '@/components/dashboard/money-snapshot';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { UpcomingBillsWidget } from '@/components/dashboard/upcoming-bills-widget';
import { SpendingAdvisor } from '@/components/dashboard/spending-advisor';
import { triggerHaptic } from '@/utils/haptics';

const RECENT_LIMIT = 5;



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
  const cashFlowScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
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

        {/* 1. Quick actions: the four most common records, one tap away */}
        <QuickActions />

        {/* 2. Needs attention: upcoming bills */}
        <UpcomingBillsWidget formatAmount={formatAmount} />

        {/* 3. Recent activity */}
        <View style={styles.sectionHeader}>
          <View>
            <ThemedText type="defaultBold">Recent activity</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Your latest transactions</ThemedText>
          </View>
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
            <>
              {filteredRecent.map((expense, index) => (
                <View key={expense.id}>
                  {index > 0 && <CardDivider />}
                  <ExpenseListItem expense={expense} />
                </View>
              ))}
              {expenses.length > 0 && (
                <>
                  <CardDivider />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="See all transactions"
                    onPress={() => {
                      triggerHaptic();
                      router.push('/(tabs)/expenses');
                    }}
                    style={({ pressed }) => [
                      styles.seeAllCardFooter,
                      { backgroundColor: theme.cardMuted },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      See all transactions
                    </ThemedText>
                    <Ionicons name="arrow-forward" size={16} color={theme.accent} />
                  </Pressable>
                </>
              )}
            </>
          )}
        </Card>


        {/* 4. Money snapshot and weekly spending */}
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

        {/* 5. Spending advisor */}
        <SpendingAdvisor expenses={expenses} limits={categoryLimits} formatAmount={formatAmount} now={now} />

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
            <MaterialCommunityIcons name="heart" size={16} color={FeatureColors.red} />
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
  seeAllCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
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
  pressed: {
    opacity: 0.75,
  },
});
