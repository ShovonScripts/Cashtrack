import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import { ProgressMeter } from '@/components/ui/progress-meter';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { NEAR_LIMIT_RATIO, getBudgetStatus, type BudgetState } from '@/utils/budget-status';

type BudgetMeterProps = {
  spent: number;
  limit: number;
  formatAmount: (amount: number) => string;
  /** Used for the spoken description, such as the category name. */
  name: string;
};

const ICONS: Record<BudgetState, 'success' | 'warning' | 'error'> = {
  ok: 'success',
  near: 'warning',
  over: 'error',
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
    <ProgressMeter
      fill={status.fill}
      color={color}
      marker={NEAR_LIMIT_RATIO}
      label={`${name} budget, ${status.label}`}
      valueText={`${status.percent} percent used, ${detail}`}>
      <View style={styles.footer}>
        <View style={styles.state}>
          <Icon name={ICONS[status.state]} size="sm" color={color} />
          <ThemedText type="caption" style={{ color }}>
            {status.label} · {detail}
          </ThemedText>
        </View>
        <ThemedText type="caption" style={{ fontWeight: '700', color }}>
          {status.percent}%
        </ThemedText>
      </View>
    </ProgressMeter>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two },
  state: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
