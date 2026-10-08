import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { useExpenses } from '@/context/expense-context';
import { Radius, Spacing } from '@/constants/theme';
import type { Expense } from '@/types/expense';
import { formatDate } from '@/utils/expense';
import { triggerHaptic } from '@/utils/motion';
import { router } from 'expo-router';

type ExpenseListItemProps = {
  expense: Expense;
  onPress?: () => void;
  index?: number;
};

export function ExpenseListItem({ expense, onPress, index = 0 }: ExpenseListItemProps) {
  const { formatAmount, categoryIcons } = useExpenses();
  const handlePress = () => {
    triggerHaptic();
    if (onPress) {
      onPress();
      return;
    }
    router.push({ pathname: '/expense/[id]', params: { id: expense.id } });
  };

  const accent = getCategoryColor(expense.category);
  const title = expense.note || expense.category;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 45, 300)).springify().damping(20).stiffness(180)}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expense.category}, ${formatAmount(expense.amount)}, ${formatDate(expense.date)}`}
        style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
        <CategoryIcon category={expense.category} customIcons={categoryIcons} color={accent} size={18} containerSize={40} />

        <View style={styles.details}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {title}
          </ThemedText>
          <View style={styles.metaRow}>
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {expense.category}
            </ThemedText>
            <ThemedView type="backgroundElement" style={styles.metaDot} />
            <ThemedText type="caption" themeColor="textSecondary">
              {formatDate(expense.date)}
            </ThemedText>
          </View>
        </View>

        <ThemedText type="defaultBold" style={styles.amount} numberOfLines={1}>
          {formatAmount(expense.amount)}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 76,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  pressed: {
    opacity: 0.6,
    transform: [{ scale: 0.99 }],
  },
  details: {
    flex: 1,
    gap: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: Radius.pill,
  },
  amount: {
    textAlign: 'right',
  },
});
