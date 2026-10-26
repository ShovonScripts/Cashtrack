import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { CostCategoryChart } from '@/components/dashboard/cost-category-chart';
import { CostSummaryCard } from '@/components/dashboard/cost-summary-card';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';
import type { CategoryTotal, CostSummary, SummaryPeriod } from '@/utils/period-summary';

const DAILY_INDEX = 1;

type CostSummaryCarouselProps = {
  summaries: CostSummary[];
  breakdowns: Record<SummaryPeriod, CategoryTotal[]>;
  formatAmount: (amount: number) => string;
  categoryIcons?: Record<string, string>;
  onOpenReport: (period: SummaryPeriod) => void;
  onAddExpense?: (period?: SummaryPeriod) => void;
};

export function CostSummaryCarousel({
  summaries,
  breakdowns,
  formatAmount,
  categoryIcons,
  onOpenReport,
  onAddExpense,
}: CostSummaryCarouselProps) {
  const theme = useTheme();
  const screenWidth = useWindowDimensions().width;
  const containerPadding = Spacing.four * 2;
  const cardWidth = Math.min(screenWidth - containerPadding, MaxContentWidth - containerPadding);
  const snapInterval = cardWidth + Spacing.three;

  const [activeIndex, setActiveIndex] = useState(DAILY_INDEX);
  const scrollRef = useRef<ScrollView>(null);
  const positionedRef = useRef(false);

  const scrollToDaily = () => {
    if (positionedRef.current) return;
    positionedRef.current = true;
    scrollRef.current?.scrollTo({ x: snapInterval * DAILY_INDEX, y: 0, animated: false });
  };

  useEffect(() => {
    positionedRef.current = false;
    const timer = setTimeout(scrollToDaily, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapInterval]);

  const handleScroll = (offsetX: number) => {
    const nextIndex = Math.round(offsetX / snapInterval);
    if (
      nextIndex >= 0
      && nextIndex < summaries.length
      && nextIndex !== activeIndex
    ) {
      setActiveIndex(nextIndex);
      triggerHaptic();
    }
  };

  const goToIndex = (index: number) => {
    setActiveIndex(index);
    triggerHaptic();
    scrollRef.current?.scrollTo({ x: snapInterval * index, y: 0, animated: true });
  };

  const activeSummary = summaries[activeIndex] ?? summaries[0];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        scrollEventThrottle={16}
        contentContainerStyle={styles.content}
        onLayout={scrollToDaily}
        onContentSizeChange={scrollToDaily}
        onScroll={(event) => handleScroll(event.nativeEvent.contentOffset.x)}>
        {summaries.map((summary) => (
          <CostSummaryCard
            key={summary.period}
            summary={summary}
            width={cardWidth}
            formatAmount={formatAmount}
            onPressReport={() => onOpenReport(summary.period)}
            onAddExpense={summary.period === 'daily' || summary.period === 'yesterday' ? () => onAddExpense?.(summary.period) : undefined}
            topCategory={breakdowns[summary.period]?.[0]}
          />
        ))}
      </ScrollView>

      <View style={styles.paginationDots}>
        {summaries.map((summary, index) => (
          <Pressable
            key={summary.period}
            onPress={() => goToIndex(index)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Go to ${summary.title.toLowerCase()} slide`}
            accessibilityState={{ selected: activeIndex === index }}>
            <View
              style={[
                styles.dot,
                {
                  width: activeIndex === index ? 22 : 6,
                  backgroundColor: activeIndex === index ? theme.accent : theme.border,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>

      {activeSummary && (
        <CostCategoryChart
          period={activeSummary.period}
          totals={breakdowns[activeSummary.period] ?? []}
          width={cardWidth}
          formatAmount={formatAmount}
          categoryIcons={categoryIcons}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  content: {
    gap: Spacing.three,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.two,
    marginBottom: Spacing.three,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
