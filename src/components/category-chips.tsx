import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryIcon } from '@/components/category-icon';
import { getCategoryColor } from '@/constants/categories';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { EXPENSE_CATEGORIES, type ExpenseCategory } from '@/types/expense';

export type CategoryFilter = ExpenseCategory | 'All';

type CategoryChipsProps = {
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  /** Adds an "All" chip at the front. Used by the filter, not the form. */
  showAll?: boolean;
  categories?: ExpenseCategory[];
  /** Enable horizontal scrolling for filter bars. Defaults to true if showAll is true. */
  horizontal?: boolean;
};

const ALL_COLOR = Brand.accent;

function colorFor(option: CategoryFilter): string {
  return option === 'All' ? ALL_COLOR : getCategoryColor(option);
}

export function CategoryChips({
  value,
  onChange,
  showAll = false,
  categories = [...EXPENSE_CATEGORIES],
  horizontal = showAll,
}: CategoryChipsProps) {
  const theme = useTheme();
  const { categoryIcons } = useExpenses();
  const options: CategoryFilter[] = showAll ? ['All', ...categories] : categories;

  const renderChips = () =>
    options.map((option) => {
      const isSelected = option === value;
      const color = colorFor(option);

      return (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          accessibilityRole="button"
          accessibilityState={{ selected: isSelected }}
          style={({ pressed }) => [
            styles.chip,
            {
              borderColor: isSelected ? color : theme.border,
              backgroundColor: isSelected ? `${color}22` : theme.cardMuted,
            },
            pressed && styles.pressed,
          ]}>
          <CategoryIcon
            category={option === 'All' ? 'Other' : option}
            customIcons={categoryIcons}
            color={color}
            size={13}
            containerSize={20}
          />
          <ThemedText
            type="caption"
            style={[
              styles.chipLabel,
              {
                color: isSelected ? theme.text : theme.textSecondary,
                fontWeight: isSelected ? '700' : '500',
              },
            ]}>
            {option}
          </ThemedText>
        </Pressable>
      );
    });

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}>
        {renderChips()}
      </ScrollView>
    );
  }

  return <View style={styles.wrapContainer}>{renderChips()}</View>;
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: 2,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.pill,
    minHeight: 32,
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
  },
  chipLabel: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});
