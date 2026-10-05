import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GoalWithProgress } from '@/context/goal-context';

export function GoalProgressCard({
  goal,
  formatAmount,
  onPress,
}: {
  goal: GoalWithProgress;
  formatAmount: (amount: number) => string;
  onPress: () => void;
}) {
  const theme = useTheme();
  const isAhead = goal.aheadBehindAmount >= 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Goal ${goal.title}, progress ${Math.round(goal.progressPercent)} percent`}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <ThemedText type="defaultBold" numberOfLines={1}>{goal.title}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
              {goal.frequency} target · {goal.isCompleted ? 'Completed 🎉' : isAhead ? '🟢 On track / Ahead' : '🟠 Behind target'}
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={{ color: theme.accent }}>
            {Math.round(goal.progressPercent)}%
          </ThemedText>
        </View>

        <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
          <View
            style={[
              styles.fill,
              {
                width: `${Math.min(100, goal.progressPercent)}%`,
                backgroundColor: goal.isCompleted ? '#27AE60' : theme.accent,
              },
            ]}
          />
        </View>

        <View style={styles.footerRow}>
          <ThemedText type="smallBold">
            {formatAmount(goal.contributedAmount)} <ThemedText type="caption" themeColor="textSecondary">/ {formatAmount(goal.targetAmount)}</ThemedText>
          </ThemedText>
          <ThemedText type="caption" themeColor={goal.isCompleted ? 'accent' : isAhead ? 'textSecondary' : 'danger'}>
            {goal.isCompleted
              ? 'Goal achieved'
              : isAhead
                ? `+${formatAmount(goal.aheadBehindAmount)} ahead`
                : `${formatAmount(Math.abs(goal.aheadBehindAmount))} behind`}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.two },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  titleGroup: { flex: 1, gap: 2 },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  pressed: { opacity: 0.78 },
});
