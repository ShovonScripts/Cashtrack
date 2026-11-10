import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Badge, Icon, ProgressMeter } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { PressFeedback, Radius, Spacing } from '@/constants/theme';
import type { GoalWithProgress } from '@/context/goal-context';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { overdueDays, potGlyph, potStatus, ruleLabel } from '@/utils/pot-display';

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
  const now = useNow(60_000);
  const status = potStatus(goal, now);
  const hasTarget = goal.targetAmount > 0;
  const percent = Math.round(goal.progressPercent);

  // The one line that says what to do or how it is going, coloured by status.
  const footer =
    status.kind === 'completed'
      ? { text: 'Target reached', color: 'success' as const }
      : status.kind === 'open-ended'
        ? { text: hasTarget ? `${formatAmount(Math.max(0, goal.targetAmount - goal.contributedAmount))} to go` : 'No target', color: 'textSecondary' as const }
        : status.kind === 'overdue'
          ? { text: lateText(overdueDays(goal, now)), color: 'danger' as const }
          : status.kind === 'behind'
            ? { text: `${formatAmount(Math.abs(goal.aheadBehindAmount))} behind`, color: 'warning' as const }
            : { text: goal.aheadBehindAmount > 0 ? `${formatAmount(goal.aheadBehindAmount)} ahead` : 'On plan', color: 'success' as const };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[
        goal.title,
        hasTarget
          ? `${formatAmount(goal.contributedAmount)} saved of ${formatAmount(goal.targetAmount)}, ${percent} percent`
          : `${formatAmount(goal.contributedAmount)} saved, no target`,
        status.label,
        ruleLabel(goal),
        status.kind === 'completed' ? '' : footer.text,
      ]
        .filter(Boolean)
        .join(', ')}
      accessibilityHint="Opens the pot"
      style={({ pressed }) => [pressed && PressFeedback]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.iconTile, { backgroundColor: theme.accentMuted }]}>
            <Icon name={potGlyph(goal.potType) as GlyphName} color={theme.accent} />
          </View>
          <View style={styles.titleGroup}>
            <ThemedText type="defaultBold" numberOfLines={2}>
              {goal.title}
            </ThemedText>
            <View style={styles.badges}>
              <Badge label={status.label} tone={status.tone} />
              <Badge label={ruleLabel(goal)} icon={goal.allocationType === 'percentage' ? 'lightning-bolt' : undefined} />
            </View>
          </View>
        </View>

        {hasTarget ? (
          <ProgressMeter
            fill={goal.progressPercent / 100}
            color={goal.isCompleted ? theme.success : theme.accent}
            label={`${goal.title} progress`}
            valueText={`${percent} percent saved`}
          />
        ) : null}

        <View style={styles.footerRow}>
          <ThemedText type="smallBold" style={styles.amount}>
            {formatAmount(goal.contributedAmount)}
            <ThemedText type="caption" themeColor="textSecondary">
              {hasTarget ? ` of ${formatAmount(goal.targetAmount)} · ${percent}%` : ' saved'}
            </ThemedText>
          </ThemedText>
          <ThemedText type="caption" themeColor={footer.color} style={styles.footerNote}>
            {footer.text}
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

function lateText(days: number): string {
  return `${days} ${days === 1 ? 'day' : 'days'} past deadline`;
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  iconTile: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  titleGroup: { flex: 1, gap: Spacing.one },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, flexWrap: 'wrap' },
  amount: { fontVariant: ['tabular-nums'], flexShrink: 1 },
  footerNote: { textAlign: 'right' },
});
