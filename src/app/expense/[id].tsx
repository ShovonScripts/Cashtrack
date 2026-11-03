import { Stack, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { Card, CardDivider } from '@/components/card';
import { CategoryIcon } from '@/components/category-icon';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Button, IconButton, Screen } from '@/components/ui';
import { getCategoryColor } from '@/constants/categories';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useDeleteExpenseFlow } from '@/context/undo-delete-context';
import { formatDate } from '@/utils/expense';
import { describeRecurrence } from '@/utils/expense-detail';

type RowProps = {
  label: string;
  value: string;
  /** Let long notes wrap instead of truncating. */
  wrap?: boolean;
};

function DetailRow({ label, value, wrap = false }: RowProps) {
  return (
    <View style={[styles.row, wrap && styles.rowWrapped]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="defaultBold" style={wrap ? styles.valueWrapped : styles.rowValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export default function ExpenseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getExpense } = useExpenses();
  const deleteWithUndo = useDeleteExpenseFlow();
  const { formatAmount, categoryIcons } = usePreferences();

  const expense = getExpense(id);

  if (!expense) {
    return (
      <Screen topInset={false}>
        <EmptyState title="Not found" message="This expense no longer exists." icon="receipt-text-outline" actionLabel="Go back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const accent = getCategoryColor(expense.category);
  const recurrence = describeRecurrence(expense);
  const goEdit = () => router.push({ pathname: '/expense/[id]/edit', params: { id: expense.id } });

  return (
    <>
      <Stack.Screen
        options={{ headerRight: () => <IconButton icon="edit" label="Edit expense" onPress={goEdit} /> }}
      />
      <Screen topInset={false}>
        <Card style={styles.hero}>
          <ThemedText type="caption" themeColor="textSecondary">
            AMOUNT
          </ThemedText>
          <ThemedText type="hero" style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(expense.amount)}
          </ThemedText>
          <View style={styles.badgeRow}>
            <CategoryIcon category={expense.category} customIcons={categoryIcons} color={accent} size={16} containerSize={32} />
            <ThemedText type="smallBold">{expense.category}</ThemedText>
          </View>
        </Card>

        <Card padded={false}>
          <View style={styles.padded}>
            <DetailRow label="Date" value={formatDate(expense.date)} />
          </View>
          <CardDivider />
          <View style={styles.padded}>
            <DetailRow label="Note" value={expense.note || 'No note added'} wrap />
          </View>
          {recurrence ? (
            <>
              <CardDivider />
              <View style={styles.padded}>
                <DetailRow
                  label="Repeats"
                  value={expense.recurringEndDate ? `${recurrence}, until ${formatDate(expense.recurringEndDate)}` : recurrence}
                  wrap
                />
              </View>
            </>
          ) : null}
          {expense.receiptUri ? (
            <>
              <CardDivider />
              <View style={styles.padded}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.receiptLabel}>
                  Receipt photo
                </ThemedText>
                <Image source={{ uri: expense.receiptUri }} style={styles.receiptImage} contentFit="contain" />
              </View>
            </>
          ) : null}
        </Card>

        <Button label="Delete expense" variant="danger" onPress={() => deleteWithUndo(expense, () => router.back())} />
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  hero: { gap: Spacing.one },
  heroValue: { fontVariant: ['tabular-nums'] },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.one },
  padded: { padding: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three },
  rowWrapped: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.one },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  valueWrapped: { alignSelf: 'stretch' },
  receiptLabel: { marginBottom: Spacing.two },
  receiptImage: { width: '100%', height: 240, borderRadius: Radius.medium },
});
