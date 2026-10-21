import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import type { YearProgress } from '@/utils/year-progress';
import { formatDaysLeft } from '@/utils/year-progress';

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

type YearProgressPanelProps = {
  progress: YearProgress;
  height: number;
  topPadding: number;
  bottomPadding?: number;
  /** True while the greeting page is showing, so screen readers skip this page. */
  hidden?: boolean;
};

export function YearProgressPanel({
  progress,
  height,
  topPadding,
  bottomPadding = 24,
  hidden = false,
}: YearProgressPanelProps) {
  return (
    <View
      accessible
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      accessibilityLabel={`Year progress for ${progress.year}. ${progress.yearPercent} percent elapsed. Day ${progress.dayOfYear} of ${progress.daysInYear}, week ${progress.weekOfYear} of ${progress.totalWeeksInYear}. ${formatDaysLeft(progress.daysLeftInYear)}.`}
      style={[
        styles.container,
        { height, paddingTop: topPadding, paddingBottom: bottomPadding },
      ]}>
      <View style={styles.group}>
        <ThemedText type="caption" style={styles.eyebrow} numberOfLines={1}>
          YEAR PROGRESS
        </ThemedText>

        <View style={styles.heroRow}>
          <ThemedText
            style={styles.heroValue}
            numberOfLines={1}
            adjustsFontSizeToFit>
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

      <View style={styles.monthStrip}>
        {MONTH_LETTERS.map((letter, index) => {
          const monthNumber = index + 1;
          const isPast = monthNumber < progress.monthNumber;
          const isCurrent = monthNumber === progress.monthNumber;
          return (
            <View key={`${letter}-${monthNumber}`} style={styles.monthCell}>
              <View
                style={[
                  styles.monthBar,
                  isCurrent ? styles.monthBarCurrent : isPast ? styles.monthBarPast : styles.monthBarFuture,
                ]}
              />
              <ThemedText
                type="caption"
                style={[
                  styles.monthLetter,
                  isCurrent && styles.monthLetterCurrent,
                  isPast && styles.monthLetterPast,
                ]}>
                {letter}
              </ThemedText>
            </View>
          );
        })}
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
  monthStrip: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  monthCell: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  monthBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
  },
  monthBarPast: {
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  monthBarCurrent: {
    backgroundColor: '#FFFFFF',
  },
  monthBarFuture: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  monthLetter: {
    fontSize: 9,
    lineHeight: 11,
    color: 'rgba(255,255,255,0.38)',
  },
  monthLetterPast: {
    color: 'rgba(255,255,255,0.7)',
  },
  monthLetterCurrent: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
