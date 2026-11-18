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
  /** Omitted only for Expense, which takes the brand accent as the main action. */
  color?: string;
};

/**
 * Two rows of four. The top row adds a record, so its glyphs carry a plus;
 * the bottom row opens a tool.
 *
 * Hues follow two rules: every icon keeps at least 3:1 against its tinted
 * badge in light and dark (the minimum for icons), and no two tiles that touch,
 * across or down, share a colour family. That is why these differ from some
 * More menu hues (amber, orange, coral and azure fall near 2:1 on a light tile).
 */
const ACTIONS: QuickAction[] = [
  { id: 'expense', label: 'Expense', hint: 'Add an expense', icon: 'receipt-text-plus-outline', route: '/add-expense' },
  { id: 'income', label: 'Income', hint: 'Record income', icon: 'wallet-plus-outline', route: '/income', color: FeatureColors.emerald },
  { id: 'bill', label: 'Bill', hint: 'Add a bill reminder', icon: 'calendar-plus-outline', route: '/bills/add', color: FeatureColors.bronze },
  { id: 'debt', label: 'Debt', hint: 'Track money lent or borrowed', icon: 'account-cash-outline', route: '/debts/add', color: FeatureColors.crimson },
  { id: 'stopwatch', label: 'Stopwatch', hint: 'Open Stopwatch & Timer', icon: 'timer-outline', route: '/stopwatch', color: FeatureColors.violet },
  { id: 'todo', label: 'To-Do', hint: 'Open To-Do List', icon: 'checkbox-marked-circle-outline', route: '/todo', color: FeatureColors.red },
  { id: 'calculator', label: 'Calculator', hint: 'Open Calculator', icon: 'calculator-variant-outline', route: '/calculator', color: FeatureColors.sky },
  { id: 'notes', label: 'Notes', hint: 'Open Notes', icon: 'note-text-outline', route: '/notes', color: FeatureColors.teal },
];

const PER_ROW = 4;
const ROWS = Array.from({ length: Math.ceil(ACTIONS.length / PER_ROW) }, (_, index) =>
  ACTIONS.slice(index * PER_ROW, index * PER_ROW + PER_ROW),
);

/** One-tap shortcuts to the four records people add most, and four everyday tools. */
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
