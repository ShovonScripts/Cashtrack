import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/haptics';

type QuickAction = {
  id: string;
  label: string;
  hint: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  route: string;
};

const ACTIONS: QuickAction[] = [
  { id: 'expense', label: 'Expense', hint: 'Add an expense', icon: 'cart-plus', route: '/add-expense' },
  { id: 'income', label: 'Income', hint: 'Record income', icon: 'wallet-plus-outline', route: '/income' },
  { id: 'bill', label: 'Bill', hint: 'Add a bill reminder', icon: 'calendar-plus', route: '/bills/add' },
  { id: 'debt', label: 'Debt', hint: 'Track money lent or borrowed', icon: 'account-cash-outline', route: '/debts/add' },
];

/** One-tap shortcuts to the four most common record screens. */
export function QuickActions() {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {ACTIONS.map((action) => (
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
          <View style={[styles.iconBadge, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name={action.icon} size={22} color={theme.accent} />
          </View>
          <ThemedText type="caption" style={styles.label} numberOfLines={1}>
            {action.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});
