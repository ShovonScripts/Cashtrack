import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ActionTile } from '@/components/ui';
import type { GlyphName } from '@/constants/icons';
import { FeatureColors, Spacing } from '@/constants/theme';
import { triggerHaptic } from '@/utils/haptics';

type QuickAction = {
  id: string;
  label: string;
  /** Spoken label: what the tap does. */
  hint: string;
  icon: GlyphName;
  route: string;
  /** The feature's own hue; leave out for the brand accent. */
  color?: string;
};

/**
 * Two rows of four. The top row opens an everyday tool; the bottom row adds a
 * record. Expense is not here: the Add tab already does that, one tap away.
 *
 * Hues follow two rules: every icon keeps at least 3:1 against its tinted
 * badge in light and dark (the minimum for icons), and no two tiles that touch,
 * across or down, share a colour family. That is why these differ from some
 * More menu hues (amber, orange, coral and azure fall near 2:1 on a light tile).
 * Gift keeps its More menu rose, so it looks the same in both places.
 */
const ACTIONS: QuickAction[] = [
  { id: 'stopwatch', label: 'Stopwatch', hint: 'Open Stopwatch & Timer', icon: 'timer-outline', route: '/stopwatch', color: FeatureColors.violet },
  { id: 'todo', label: 'To-Do', hint: 'Open To-Do List', icon: 'checkbox-marked-circle-outline', route: '/todo', color: FeatureColors.red },
  { id: 'calculator', label: 'Calculator', hint: 'Open Calculator', icon: 'calculator-variant-outline', route: '/calculator', color: FeatureColors.sky },
  { id: 'notes', label: 'Notes', hint: 'Open Notes', icon: 'note-text-outline', route: '/notes', color: FeatureColors.teal },
  { id: 'gift', label: 'Gift', hint: 'Add a gift you received', icon: 'gift-outline', route: '/gifts/add', color: FeatureColors.rose },
  { id: 'income', label: 'Income', hint: 'Record income', icon: 'wallet-plus-outline', route: '/income', color: FeatureColors.emerald },
  { id: 'bill', label: 'Bill', hint: 'Add a bill reminder', icon: 'calendar-plus-outline', route: '/bills/add', color: FeatureColors.bronze },
  { id: 'debt', label: 'Debt', hint: 'Track money lent or borrowed', icon: 'account-cash-outline', route: '/debts/add', color: FeatureColors.crimson },
];

const PER_ROW = 4;
const ROWS = Array.from({ length: Math.ceil(ACTIONS.length / PER_ROW) }, (_, index) =>
  ACTIONS.slice(index * PER_ROW, index * PER_ROW + PER_ROW),
);

/** One-tap shortcuts to four everyday tools, and four records to add. */
export function QuickActions() {
  return (
    <View style={styles.rows}>
      {ROWS.map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((action) => (
            <ActionTile
              key={action.id}
              label={action.label}
              icon={action.icon}
              color={action.color}
              accessibilityLabel={action.hint}
              onPress={() => {
                triggerHaptic();
                router.push(action.route as never);
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
});
