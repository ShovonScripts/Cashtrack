import { router, useLocalSearchParams } from 'expo-router';

import { ExpenseCalculator } from '@/components/expense-calculator';
import { useExpenses } from '@/context/expense-context';

export default function AddExpenseScreen() {
  const { addExpense } = useExpenses();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const requestedDate = typeof date === 'string' ? new Date(date) : null;
  const initialDate = requestedDate && !Number.isNaN(requestedDate.getTime())
    ? requestedDate.toISOString()
    : undefined;

  return (
    <ExpenseCalculator
      initialValues={initialDate ? { date: initialDate } : undefined}
      submitLabel="Save expense"
      onCancel={() => router.back()}
      onSubmit={(draft) => {
        addExpense(draft);
        router.back();
      }}
    />
  );
}
