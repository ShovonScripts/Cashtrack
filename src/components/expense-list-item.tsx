import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { CategoryIcon } from '@/components/category-icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getCategoryColor } from '@/constants/categories';
import { usePreferences } from '@/context/expense-context';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Expense } from '@/types/expense';
import { formatDate } from '@/utils/expense';
import { triggerHaptic } from '@/utils/motion';
import { router } from 'expo-router';

type ExpenseListItemProps = {
  expense: Expense;
  onPress?: () => void;
  index?: number;
  /** When set, swiping the row reveals a Delete button that calls this. */
  onSwipeDelete?: (expense: Expense) => void;
};

export function ExpenseListItem({ expense, onPress, index = 0, onSwipeDelete }: ExpenseListItemProps) {
  const theme = useTheme();
  const { formatAmount, categoryIcons } = usePreferences();
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

  const row = (
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${title}, ${expense.category}, ${formatAmount(expense.amount)}, ${formatDate(expense.date)}`}
        accessibilityActions={onSwipeDelete ? [{ name: 'delete', label: 'Delete' }] : undefined}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'delete') onSwipeDelete?.(expense);
        }}
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
  );

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index * 45, 300)).springify().damping(20).stiffness(180)}>
      {onSwipeDelete ? (
        <ReanimatedSwipeable
          friction={2}
          rightThreshold={40}
          overshootRight={false}
          renderRightActions={(_progress, _translation, methods) => (
            <Pressable
              onPress={() => {
                methods.close();
                onSwipeDelete(expense);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${title}`}
              style={[styles.deleteAction, { backgroundColor: theme.dangerFill }]}>
              <MaterialCommunityIcons name="trash-can-outline" size={22} color={Palette.white} />
              <ThemedText type="caption" style={styles.deleteLabel}>
                Delete
              </ThemedText>
            </Pressable>
          )}>
          {row}
        </ReanimatedSwipeable>
      ) : (
        row
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  deleteAction: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  deleteLabel: {
    color: Palette.white,
    fontWeight: '700',
  },
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
