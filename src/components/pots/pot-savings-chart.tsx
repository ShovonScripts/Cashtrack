import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GoalContribution } from '@/types/goal';
import { runningTotals } from '@/utils/pot-display';

const MAX_BARS = 12;
const BAR_HEIGHT = 72;

type PotSavingsChartProps = {
  contributions: readonly GoalContribution[];
  /** Scales the bars against the target when there is one, so a full bar means "reached". */
  targetAmount: number;
  formatAmount: (amount: number) => string;
};

/** Total in the pot after each contribution, oldest on the left. */
export function PotSavingsChart({ contributions, targetAmount, formatAmount }: PotSavingsChartProps) {
  const theme = useTheme();
  const points = runningTotals(contributions).slice(-MAX_BARS);
  if (points.length < 2) return null;

  const top = Math.max(targetAmount, ...points.map((p) => p.total), 1);
  const first = points[0];
  const last = points[points.length - 1];
  const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' });

  return (
    <View
      accessible
      accessibilityLabel={`Savings over time: from ${formatAmount(first.total)} on ${dateFormat.format(new Date(first.contribution.date))} to ${formatAmount(last.total)} on ${dateFormat.format(new Date(last.contribution.date))}`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {points.map(({ contribution, total }) => (
          <View key={contribution.id} style={styles.column}>
            <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.fill,
                  { height: Math.max(4, (total / top) * BAR_HEIGHT), backgroundColor: theme.accent },
                ]}
              />
            </View>
            <ThemedText type="micro" themeColor="textSecondary" numberOfLines={1}>
              {dateFormat.format(new Date(contribution.date))}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
      <View style={styles.legend}>
        <ThemedText type="caption" themeColor="textSecondary">
          {points.length < contributions.length ? `Last ${points.length} additions` : `${points.length} additions`}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Now {formatAmount(last.total)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { gap: Spacing.three, paddingVertical: Spacing.one, alignItems: 'flex-end' },
  column: { alignItems: 'center', gap: Spacing.one, minWidth: 44 },
  track: { width: 16, height: BAR_HEIGHT, borderRadius: Radius.pill, justifyContent: 'flex-end', overflow: 'hidden' },
  fill: { width: '100%', borderRadius: Radius.pill },
  legend: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two, marginTop: Spacing.two },
});
