import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { CategoryChips } from '@/components/category-chips';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, FormField, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { EXPENSE_CATEGORIES, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { sumAmounts } from '@/utils/expense';

type ExpenseFormProps = {
  initialValues?: Partial<ExpenseDraft>;
  excludeExpenseId?: string;
  submitLabel: string;
  onSubmit: (draft: ExpenseDraft) => void;
  onCancel?: () => void;
  /** When set, a Delete button is shown under Cancel. */
  onDelete?: () => void;
  /** Text shown under the form, e.g. "The date cannot be changed yet." */
  footerNote?: string;
};

const EMPTY_VALUES: ExpenseDraft = {
  amount: 0,
  category: EXPENSE_CATEGORIES[0],
  note: '',
};

export function ExpenseForm({
  initialValues,
  excludeExpenseId,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
  footerNote,
}: ExpenseFormProps) {
  const theme = useTheme();
  const { expenses } = useExpenses();
  const { categories, categoryLimits, country, formatAmount } = usePreferences();

  const [amountText, setAmountText] = useState(initialValues?.amount === undefined ? '' : String(initialValues.amount));
  const [date, setDate] = useState(() => initialValues?.date ? new Date(initialValues.date) : new Date());
  const [category, setCategory] = useState<ExpenseCategory>(initialValues?.category ?? EMPTY_VALUES.category);
  const [note, setNote] = useState<string>(initialValues?.note ?? EMPTY_VALUES.note);

  const parsedAmount = amountText.trim() === '' ? null : Number(amountText);
  const isValid = parsedAmount !== null && Number.isFinite(parsedAmount) && parsedAmount > 0;
  const showAmountError = amountText.length > 0 && !isValid;
  const now = new Date();
  const isThisMonth = date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  const existingCategorySpend = sumAmounts(expenses.filter((expense) => {
    if (expense.id === excludeExpenseId || expense.category !== category) return false;
    const expenseDate = new Date(expense.date);
    return expenseDate.getFullYear() === now.getFullYear() && expenseDate.getMonth() === now.getMonth();
  }));
  const projectedCategorySpend = existingCategorySpend + (parsedAmount ?? 0);
  const categoryLimit = categoryLimits[category];
  const budgetNotice = isThisMonth && isValid && categoryLimit !== undefined
    ? projectedCategorySpend > categoryLimit
      ? `Heads up: this would put ${formatAmount(projectedCategorySpend - categoryLimit)} over your ${category} limit.`
      : projectedCategorySpend / categoryLimit >= 0.8
        ? projectedCategorySpend === categoryLimit
          ? `Heads up: this will use your full ${category} limit.`
          : `Heads up: this would use ${Math.round((projectedCategorySpend / categoryLimit) * 100)}% of your ${category} limit, with ${formatAmount(categoryLimit - projectedCategorySpend)} left.`
        : null
    : null;

  const handleSubmit = () => {
    if (!isValid || parsedAmount === null) {
      return;
    }
    onSubmit({ amount: parsedAmount, category, note: note.trim(), date: date.toISOString() });
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen topInset={false}>
        <AmountField
          label="Amount"
          value={amountText}
          onChangeText={setAmountText}
          symbol={country.symbol.trim()}
          error={showAmountError ? 'Enter a valid amount greater than zero.' : undefined}
        />

        <View style={styles.field}>
          <ThemedText type="smallBold">Date</ThemedText>
          <DatePicker value={date} onChange={setDate} />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Category</ThemedText>
          {/* `showAll` is off here, so the callback only ever gets real categories. */}
          <CategoryChips
            categories={categories}
            value={category}
            onChange={(next) => {
              if (next !== 'All') {
                setCategory(next);
              }
            }}
          />
          {budgetNotice ? (
            <ThemedText
              type="caption"
              accessibilityLiveRegion="polite"
              style={{ color: categoryLimit !== undefined && projectedCategorySpend > categoryLimit ? theme.danger : theme.warning }}>
              {budgetNotice}
            </ThemedText>
          ) : null}
        </View>

        <FormField
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="What was it for?"
          helper="Optional"
          multiline
        />

        <Button label={submitLabel} onPress={handleSubmit} disabled={!isValid} />
        {onCancel ? <Button label="Cancel" variant="ghost" onPress={onCancel} /> : null}
        {onDelete ? <Button label="Delete expense" variant="danger" onPress={onDelete} /> : null}

        {footerNote ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.footerNote}>
            {footerNote}
          </ThemedText>
        ) : null}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  footerNote: { textAlign: 'center' },
});
