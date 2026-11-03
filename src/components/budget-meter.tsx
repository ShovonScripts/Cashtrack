import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { NEAR_LIMIT_RATIO, getBudgetStatus, type BudgetState } from '@/utils/budget-status';

type BudgetMeterProps = {
  spent: number;
  limit: number;
  formatAmount: (amount: number) => string;
  /** Used for the spoken description, such as the category name. */
  name: string;
};

const ICONS: Record<BudgetState, keyof typeof MaterialCommunityIcons.glyphMap> = {
  ok: 'check-circle-outline',
  near: 'alert-outline',
  over: 'alert-circle',
};

/**
 * Progress bar for a spending cap. Colour, an icon and a text label all show
 * the state, so it never depends on colour alone. A tick marks the 80% warning point.
 */
export function BudgetMeter({ spent, limit, formatAmount, name }: BudgetMeterProps) {
  const theme = useTheme();
  const status = getBudgetStatus(spent, limit);
  const color = status.state === 'over' ? theme.danger : status.state === 'near' ? theme.warning : theme.success;
  const detail =
    status.state === 'over'
      ? `${formatAmount(-status.remaining)} over limit`
      : `${formatAmount(status.remaining)} remaining`;

  return (
    <View
      style={styles.block}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`${name} budget, ${status.label}`}
      accessibilityValue={{ min: 0, max: 100, now: Math.min(status.percent, 100), text: `${status.percent} percent used, ${detail}` }}>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${status.fill * 100}%`, backgroundColor: color }]} />
        <View style={[styles.tick, { left: `${NEAR_LIMIT_RATIO * 100}%`, backgroundColor: theme.background }]} />
      </View>
      <View style={styles.footer}>
        <View style={styles.state}>
          <MaterialCommunityIcons name={ICONS[status.state]} size={14} color={color} />
          <ThemedText type="caption" style={{ color }}>
            {status.label} · {detail}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ fontWeight: '700', color }}>
          {status.percent}%
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.one },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.7 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  state: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
