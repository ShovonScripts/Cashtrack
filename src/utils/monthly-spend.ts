import type { Expense } from '@/types/expense';

/**
 * Twelve calendar-month spend totals for one year, January at index 0. Months
 * with no expenses stay at 0 so callers can render an axis without gaps.
 */
export function getMonthlySpendTotals(expenses: Expense[], year: number): number[] {
  const totals = new Array<number>(12).fill(0);
  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (date.getFullYear() !== year) continue;
    totals[date.getMonth()] += expense.amount;
  }
  return totals;
}
