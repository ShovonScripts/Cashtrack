import { StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { ExpenseListItem } from '@/components/expense-list-item';
import { getCategoryColor } from '@/constants/categories';
import { Radius, tintedShadow, withAlpha } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import type { Expense } from '@/types/expense';

type ExpenseCardProps = {
  expense: Expense;
  onSwipeDelete?: (expense: Expense) => void;
};

/**
 * One transaction as its own card, glowing faintly in its category colour.
 * Used by Transactions and Home's recent list; stack them with a
 * `Spacing.two` gap so each shadow has room to show.
 */
export function ExpenseCard({ expense, onSwipeDelete }: ExpenseCardProps) {
  const isDark = useIsDark();
  const accent = getCategoryColor(expense.category);

  return (
    <Card
      padded={false}
      elevated={false}
      style={[
        styles.card,
        { boxShadow: tintedShadow(accent, isDark), borderColor: withAlpha(accent, isDark ? 0.4 : 0.22) },
      ]}>
      <ExpenseListItem expense={expense} onSwipeDelete={onSwipeDelete} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.medium },
});
