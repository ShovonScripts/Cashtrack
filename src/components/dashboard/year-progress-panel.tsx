import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { YearProgress } from '@/utils/year-progress';
import { formatDaysLeft } from '@/utils/year-progress';

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const CHART_HEIGHT = 44;

type YearProgressPanelProps = {
  progress: YearProgress;
  /** Twelve calendar-month spend totals, January at index 0. */
  monthlySpend: number[];
  formatAmount: (amount: number) => string;
  height: number;
  topPadding: number;
  bottomPadding?: number;
  /** True while the greeting page is showing, so screen readers skip this page. */
  hidden?: boolean;
};

export function YearProgressPanel({
  progress,
  monthlySpend,
  formatAmount,
  height,
  topPadding,
  bottomPadding = 24,
  hidden = false,
}: YearProgressPanelProps) {
  const [selectedMonth, setSelectedMonth] = useState(progress.monthNumber);

  const maxSpend = Math.max(...monthlySpend, 1);
  const selectedSpend = monthlySpend[selectedMonth - 1] ?? 0;
  const selectedIsCurrent = selectedMonth === progress.monthNumber;

  return (
    <View
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.container,
        { height, paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}>
      <View
        accessible
        accessibilityLabel={`Year progress for ${progress.year}. ${progress.yearPercent} percent elapsed. Day ${progress.dayOfYear} of ${progress.daysInYear}, week ${progress.weekOfYear} of ${progress.totalWeeksInYear}. Currently ${progress.monthLabel}, day ${progress.dayOfMonth} of ${progress.daysInMonth}. ${formatDaysLeft(progress.daysLeftInYear)}.`}
        style={styles.group}>
        <ThemedText type="caption" style={styles.eyebrow} numberOfLines={1}>
          YEAR PROGRESS
        </ThemedText>

        <View style={styles.heroRow}>
          <ThemedText style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {progress.yearPercent}%
          </ThemedText>
          <ThemedText type="small" style={styles.heroSuffix}>
            of {progress.year}
          </ThemedText>
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress.yearPercent}%` }]} />
        </View>

        <View style={styles.supportRow}>
          <ThemedText type="small" style={styles.supportText} numberOfLines={1}>
            Day {progress.dayOfYear} · Week {progress.weekOfYear} of {progress.totalWeeksInYear}
          </ThemedText>
          <ThemedText type="small" style={styles.supportLeft} numberOfLines={1}>
            {formatDaysLeft(progress.daysLeftInYear)}
          </ThemedText>
        </View>
      </View>

      <View style={styles.chartSection}>
        <View style={styles.chartHeader}>
          <ThemedText type="caption" style={styles.chartTitle} numberOfLines={1}>
            SPENDING BY MONTH
          </ThemedText>
          <ThemedText type="caption" style={styles.chartSelected} numberOfLines={1}>
            {MONTH_SHORT[selectedMonth - 1]} ·{' '}
            {selectedSpend > 0 ? formatAmount(selectedSpend) : 'No spending'}
            {selectedIsCurrent && selectedSpend > 0 ? ' so far' : ''}
          </ThemedText>
        </View>

        <View style={styles.chart}>
          {MONTH_LETTERS.map((letter, index) => {
            const monthNumber = index + 1;
            const spend = monthlySpend[index] ?? 0;
            const isSelected = monthNumber === selectedMonth;
            const isCurrent = monthNumber === progress.monthNumber;
            const barHeight = spend > 0 ? Math.max(4, (spend / maxSpend) * CHART_HEIGHT) : 2;
            const barColor = isSelected
              ? '#FFFFFF'
              : isCurrent
                ? 'rgba(255,255,255,0.34)'
                : spend > 0
                  ? 'rgba(255,255,255,0.5)'
                  : 'rgba(255,255,255,0.16)';

            return (
              <Pressable
                key={`${letter}-${monthNumber}`}
                onPress={() => setSelectedMonth(monthNumber)}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${MONTH_SHORT[index]}, ${
                  spend > 0 ? formatAmount(spend) : 'no spending'
                }${isCurrent && spend > 0 ? ', month to date' : ''}`}
                style={styles.monthCell}>
                <View style={styles.barArea}>
                  <View style={[styles.bar, { height: barHeight, backgroundColor: barColor }]} />
                </View>
                <ThemedText
                  type="caption"
                  style={[
                    styles.monthLetter,
                    isCurrent && styles.monthLetterCurrent,
                    isSelected && styles.monthLetterSelected,
                  ]}>
                  {letter}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    justifyContent: 'space-between',
  },
  group: {
    gap: 10,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  heroSuffix: {
    color: 'rgba(255,255,255,0.82)',
  },
  track: {
    height: 8,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: '#FFFFFF',
  },
  supportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  supportText: {
    flexShrink: 1,
    color: 'rgba(255,255,255,0.86)',
    fontVariant: ['tabular-nums'],
  },
  supportLeft: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chartSection: {
    gap: 6,
  },
  chartHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  chartTitle: {
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 1.1,
    fontWeight: '700',
  },
  chartSelected: {
    flexShrink: 1,
    color: '#FFFFFF',
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barArea: {
    width: '100%',
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '78%',
    borderRadius: 3,
  },
  monthLetter: {
    fontSize: 9,
    lineHeight: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  monthLetterCurrent: {
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '700',
  },
  monthLetterSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
