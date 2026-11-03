import type { Expense } from '../types/expense';
import { roundMoney } from './money.ts';

export type CategoryChange = {
  category: string;
  current: number;
  previous: number;
  /** current minus previous; positive means more spending. */
  delta: number;
};

export type MonthComparison = {
  current: number;
  previous: number;
  delta: number;
  /** Whole-number percent change against the previous period, or null when there is nothing to compare. */
  percent: number | null;
  direction: 'up' | 'down' | 'flat' | 'new';
  /** Day of the month both periods were cut off at, or null when whole months are compared. */
  throughDay: number | null;
  /** Up to three categories whose spending changed the most. */
  movers: CategoryChange[];
  /** Up to three biggest categories this month, with their share of the total. */
  topCategories: { category: string; amount: number; share: number }[];
};

function monthKey(date: Date): number {
  return date.getFullYear() * 12 + date.getMonth();
}

/**
 * Compares a month with the month before it.
 *
 * While the chosen month is still in progress, both months are cut off at the
 * same day, so an early-month check is never compared with a full month.
 */
export function compareMonths(
  expenses: readonly Pick<Expense, 'amount' | 'category' | 'date'>[],
  month: Date,
  today: Date = new Date()
): MonthComparison {
  const currentKey = monthKey(month);
  const previousKey = currentKey - 1;
  const inProgress = monthKey(today) === currentKey;
  const throughDay = inProgress ? today.getDate() : null;

  const current = new Map<string, number>();
  const previous = new Map<string, number>();

  for (const expense of expenses) {
    const date = new Date(expense.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = monthKey(date);
    if (key !== currentKey && key !== previousKey) continue;
    if (throughDay !== null && date.getDate() > throughDay) continue;
    const bucket = key === currentKey ? current : previous;
    bucket.set(expense.category, (bucket.get(expense.category) ?? 0) + expense.amount);
  }

  const sum = (map: Map<string, number>) => roundMoney([...map.values()].reduce((a, b) => a + b, 0));
  const currentTotal = sum(current);
  const previousTotal = sum(previous);
  const delta = roundMoney(currentTotal - previousTotal);

  let direction: MonthComparison['direction'];
  if (previousTotal === 0 && currentTotal > 0) direction = 'new';
  else if (delta === 0) direction = 'flat';
  else direction = delta > 0 ? 'up' : 'down';

  const categories = new Set([...current.keys(), ...previous.keys()]);
  const movers = [...categories]
    .map((category) => {
      const cur = roundMoney(current.get(category) ?? 0);
      const prev = roundMoney(previous.get(category) ?? 0);
      return { category, current: cur, previous: prev, delta: roundMoney(cur - prev) };
    })
    .filter((change) => change.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 3);

  const topCategories = [...current.entries()]
    .map(([category, amount]) => ({
      category,
      amount: roundMoney(amount),
      share: currentTotal > 0 ? Math.round((amount / currentTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  return {
    current: currentTotal,
    previous: previousTotal,
    delta,
    percent: previousTotal > 0 ? Math.round((Math.abs(delta) / previousTotal) * 100) : null,
    direction,
    throughDay,
    movers,
    topCategories,
  };
}
