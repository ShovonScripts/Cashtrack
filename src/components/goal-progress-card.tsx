import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  const isFlexible = goal.allocationType === 'flexible';
  const isAhead = goal.aheadBehindAmount >= 0;

  const potIcon = goal.potType === 'children' ? 'baby-face-outline' : goal.potType === 'emergency' ? 'shield-check-outline' : goal.potType === 'dream' ? 'star-shooting-outline' : 'piggy-bank';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Goal ${goal.title}, progress ${Math.round(goal.progressPercent)} percent`}
      style={({ pressed }) => [pressed && styles.pressed]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name={potIcon} size={20} color={theme.accent} />
          </View>
          <View style={styles.titleGroup}>
            <View style={styles.titleLine}>
              <ThemedText type="defaultBold" numberOfLines={1} style={{ flex: 1 }}>{goal.title}</ThemedText>
              {isFlexible ? (
                <View style={[styles.badgePill, { backgroundColor: '#2D9CDB1A' }]}>
                  <MaterialCommunityIcons name="piggy-bank-outline" size={12} color="#2D9CDB" />
                  <ThemedText type="caption" style={{ color: '#2D9CDB', fontWeight: '700', fontSize: 10 }}>Flexible Stash</ThemedText>
                </View>
              ) : goal.allocationType === 'percentage' && goal.allocationPercent ? (
                <View style={[styles.badgePill, { backgroundColor: '#10B9811A' }]}>
                  <MaterialCommunityIcons name="lightning-bolt" size={12} color="#10B981" />
                  <ThemedText type="caption" style={{ color: '#10B981', fontWeight: '700', fontSize: 10 }}>{goal.allocationPercent}% Auto-Save</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="caption" themeColor="textSecondary" style={{ textTransform: 'capitalize' }}>
              {isFlexible ? 'Open-ended savings stash' : `${goal.frequency} target · ${goal.isCompleted ? 'Completed' : isAhead ? 'On track / Ahead' : 'Behind target'}`}
            </ThemedText>
          </View>
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
          <ThemedText type="caption" themeColor={goal.isCompleted ? 'accent' : 'textSecondary'}>
            {goal.isCompleted
              ? 'Goal achieved'
              : isFlexible
                ? 'Stashed safely'
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
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  iconBadge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1, gap: 2 },
  titleLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.one },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6, paddingVertical: 2, borderRadius: Radius.pill },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  pressed: { opacity: 0.78 },
});
