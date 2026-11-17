import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FeatureColors, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/haptics';

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
  color?: string;
};

const ACTIONS: QuickAction[] = [
  { id: 'expense', label: 'Expense', hint: 'Add an expense', icon: 'cart-plus', route: '/add-expense' },
  { id: 'income', label: 'Income', hint: 'Record income', icon: 'wallet-plus-outline', route: '/income' },
  { id: 'bill', label: 'Bill', hint: 'Add a bill reminder', icon: 'calendar-plus', route: '/bills/add' },
  { id: 'debt', label: 'Debt', hint: 'Track money lent or borrowed', icon: 'account-cash-outline', route: '/debts/add' },
  {
    id: 'stopwatch',
    label: 'Stopwatch & Timer',
    hint: 'Open Stopwatch & Timer',
    icon: 'timer-outline',
    route: '/stopwatch',
    color: FeatureColors.bronze,
  },
  {
    id: 'todo',
    label: 'To-Do',
    hint: 'Open To-Do List',
    icon: 'checkbox-marked-circle-outline',
    route: '/todo',
    color: FeatureColors.crimson,
  },
  {
    id: 'calculator',
    label: 'Calculator',
    hint: 'Open Calculator',
    icon: 'calculator-variant-outline',
    route: '/calculator',
    color: FeatureColors.blue,
  },
  {
    id: 'notes',
    label: 'Notes',
    hint: 'Open Notes',
    icon: 'note-text-outline',
    route: '/notes',
    color: '#C2410C',
  },
];

/** One-tap shortcuts to common records and tools. */
export function QuickActions() {
  const theme = useTheme();

  return (
    <View style={styles.rows}>
      {[ACTIONS.slice(0, 4), ACTIONS.slice(4)].map((row) => (
        <View key={row[0].id} style={styles.row}>
          {row.map((action) => {
            const iconColor = action.color ?? theme.accent;
            return (
              <Pressable
                key={action.id}
                onPress={() => {
                  triggerHaptic();
                  router.push(action.route as never);
                }}
                accessibilityRole="button"
                accessibilityLabel={action.hint}
                style={({ pressed }) => [
                  styles.action,
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.iconBadge, { backgroundColor: action.color ? withAlpha(iconColor, 0.12) : theme.accentMuted }]}>
                  <MaterialCommunityIcons name={action.icon} size={22} color={iconColor} />
                </View>
                <ThemedText type="caption" style={styles.label} numberOfLines={2}>
                  {action.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  rows: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    minHeight: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.two,
    paddingHorizontal: 2,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
