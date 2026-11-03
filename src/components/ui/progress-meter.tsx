import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProgressMeterProps = {
  /** Filled share of the bar, 0 to 1. */
  fill: number;
  color: string;
  /** Optional tick on the bar, 0 to 1, such as the 80% warning point. */
  marker?: number;
  /** Spoken name, such as "Food budget, Near limit". */
  label: string;
  /** Spoken value, such as "82 percent used, 1,800 remaining". */
  valueText: string;
  /** Rows under the bar, such as a status line and a percentage. */
  children?: ReactNode;
};

/** The one progress bar, used by budgets and savings pots. */
export function ProgressMeter({ fill, color, marker, label, valueText, children }: ProgressMeterProps) {
  const theme = useTheme();
  const clamped = Math.min(Math.max(fill, 0), 1);

  return (
    <View
      style={styles.block}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100), text: valueText }}>
      <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
        <View style={[styles.fill, { width: `${clamped * 100}%`, backgroundColor: color }]} />
        {marker !== undefined ? (
          <View style={[styles.tick, { left: `${Math.min(Math.max(marker, 0), 1) * 100}%`, backgroundColor: theme.background }]} />
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.one },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  tick: { position: 'absolute', top: 0, bottom: 0, width: 2, opacity: 0.7 },
});
