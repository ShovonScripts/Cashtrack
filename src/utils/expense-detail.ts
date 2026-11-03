import type { Expense } from '../types/expense';

/**
 * The details page exists to show what a list row cannot: the receipt photo
 * and the recurring schedule. An expense with neither has nothing extra to
 * show, so tapping it should go straight to the edit form.
 */
export function hasExtraDetails(
  expense: Pick<Expense, 'receiptUri' | 'isRecurring' | 'recurringParentId'>
): boolean {
  return Boolean(expense.receiptUri) || Boolean(expense.isRecurring) || Boolean(expense.recurringParentId);
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Every day',
  weekly: 'Every week',
  monthly: 'Every month',
  yearly: 'Every year',
};

/** Plain-language description of how an expense repeats, or null when it does not. */
export function describeRecurrence(
  expense: Pick<Expense, 'isRecurring' | 'recurringFrequency' | 'recurringParentId'>
): string | null {
  if (expense.recurringParentId) return 'Created by a recurring expense';
  if (!expense.isRecurring) return null;
  const frequency = expense.recurringFrequency;
  return (frequency && FREQUENCY_LABELS[frequency]) || 'Repeats';
}
