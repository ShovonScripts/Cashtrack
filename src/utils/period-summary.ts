import type { Expense, ExpenseCategory } from '@/types/expense';
import type { FirstDayOfWeek } from '@/types/preferences';

export type SummaryPeriod = 'yesterday' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type PeriodRange = {
  start: Date;
  end: Date;
};

export type CostSummary = {
  period: SummaryPeriod;
  title: string;
  rangeLabel: string;
  detail: string;
  amount: number;
  count: number;
};

export type CategoryTotal = {
  category: ExpenseCategory;
  amount: number;
  percent: number;
};

/** Slide order on the Home cost carousel. Daily is the default slide. */
export const SUMMARY_PERIODS: SummaryPeriod[] = [
  'yesterday',
  'daily',
  'weekly',
  'monthly',
  'yearly',
];

const dayFormatter = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});
const monthShortFormatter = new Intl.DateTimeFormat('en', { month: 'short' });
const monthYearFormatter = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return new Date(next.getFullYear(), next.getMonth(), next.getDate());
}

function sumAmounts(expenses: Expense[]): number {
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Half-open local date range for a summary period: `start <= date < end`.
 * Local constructors are used so month lengths, leap years and DST transitions
 * never shift a period boundary.
 */
export function getPeriodRange(
  period: SummaryPeriod,
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): PeriodRange {
  const today = startOfDay(now);

  switch (period) {
    case 'yesterday':
      return { start: addDays(today, -1), end: today };
    case 'daily':
      return { start: today, end: addDays(today, 1) };
    case 'weekly': {
      const startOffset = firstDayOfWeek === 'sunday'
        ? today.getDay()
        : (today.getDay() + 6) % 7;
      const start = addDays(today, -startOffset);
      return { start, end: addDays(start, 7) };
    }
    case 'monthly':
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      };
    case 'yearly':
      return {
        start: new Date(today.getFullYear(), 0, 1),
        end: new Date(today.getFullYear() + 1, 0, 1),
      };
  }
}

export function isWithinRange(isoDate: string, range: PeriodRange): boolean {
  const time = new Date(isoDate).getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}

export function filterExpensesByRange(expenses: Expense[], range: PeriodRange): Expense[] {
  return expenses.filter((expense) => isWithinRange(expense.date, range));
}

export function filterExpensesByPeriod(
  expenses: Expense[],
  period: SummaryPeriod,
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): Expense[] {
  return filterExpensesByRange(expenses, getPeriodRange(period, now, firstDayOfWeek));
}

/** The seven local days in the current calendar week, in display order. */
export function getWeekDays(now: Date = new Date(), firstDayOfWeek: FirstDayOfWeek = 'monday'): Date[] {
  const range = getPeriodRange('weekly', now, firstDayOfWeek);
  return Array.from({ length: 7 }, (_, index) => addDays(range.start, index));
}

export function getPeriodTitle(period: SummaryPeriod): string {  switch (period) {
    case 'yesterday':
      return 'YESTERDAY COST';
    case 'daily':
      return 'DAILY COST';
    case 'weekly':
      return 'WEEKLY COST';
    case 'monthly':
      return 'MONTHLY COST';
    case 'yearly':
      return 'YEARLY COST';
  }
}

export function getPeriodRangeLabel(
  period: SummaryPeriod,
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): string {
  const range = getPeriodRange(period, now, firstDayOfWeek);

  switch (period) {
    case 'daily':
      return dayFormatter.format(now);
    case 'yesterday':
      return dayFormatter.format(range.start);
    case 'weekly': {
      const lastDay = addDays(range.end, -1);
      const startMonth = monthShortFormatter.format(range.start);
      const endMonth = monthShortFormatter.format(lastDay);

      if (range.start.getFullYear() !== lastDay.getFullYear()) {
        return `${range.start.getDate()} ${startMonth} ${range.start.getFullYear()} – ${lastDay.getDate()} ${endMonth} ${lastDay.getFullYear()}`;
      }
      if (startMonth !== endMonth) {
        return `${range.start.getDate()} ${startMonth} – ${lastDay.getDate()} ${endMonth}`;
      }
      return `${range.start.getDate()} – ${lastDay.getDate()} ${startMonth}`;
    }
    case 'monthly':
      return monthYearFormatter.format(range.start);
    case 'yearly':
      return String(range.start.getFullYear());
  }
}

export function getPeriodDetail(period: SummaryPeriod, count: number): string {
  const noun = count === 1 ? 'expense' : 'expenses';

  switch (period) {
    case 'daily':
      return count === 0 ? 'No expenses recorded today.' : `${count} ${noun} recorded today.`;
    case 'yesterday':
      return count === 0 ? 'No expenses recorded yesterday.' : `${count} ${noun} recorded yesterday.`;
    case 'weekly':
      return count === 0 ? 'No expenses recorded this week.' : `${count} ${noun} recorded this week.`;
    case 'monthly':
      return count === 0 ? 'No expenses recorded this month.' : `${count} ${noun} recorded this month.`;
    case 'yearly':
      return count === 0 ? 'No expenses recorded this year.' : `${count} ${noun} recorded this year.`;
  }
}

export function buildCostSummary(
  expenses: Expense[],
  period: SummaryPeriod,
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): CostSummary {
  const periodExpenses = filterExpensesByPeriod(expenses, period, now, firstDayOfWeek);

  return {
    period,
    title: getPeriodTitle(period),
    rangeLabel: getPeriodRangeLabel(period, now, firstDayOfWeek),
    detail: getPeriodDetail(period, periodExpenses.length),
    amount: sumAmounts(periodExpenses),
    count: periodExpenses.length,
  };
}

export function buildCostSummaries(
  expenses: Expense[],
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): CostSummary[] {
  return SUMMARY_PERIODS.map((period) => buildCostSummary(expenses, period, now, firstDayOfWeek));
}

/** Category totals for a period, largest first, with percentage share of the period total. */
export function getCategoryTotals(
  expenses: Expense[],
  period: SummaryPeriod,
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): CategoryTotal[] {
  const periodExpenses = filterExpensesByPeriod(expenses, period, now, firstDayOfWeek);
  const total = sumAmounts(periodExpenses);
  const totals = new Map<ExpenseCategory, number>();

  for (const expense of periodExpenses) {
    totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount,
      percent: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((first, second) => second.amount - first.amount);
}

export function buildCategoryBreakdowns(
  expenses: Expense[],
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): Record<SummaryPeriod, CategoryTotal[]> {
  return SUMMARY_PERIODS.reduce(
    (breakdowns, period) => {
      breakdowns[period] = getCategoryTotals(expenses, period, now, firstDayOfWeek);
      return breakdowns;
    },
    {} as Record<SummaryPeriod, CategoryTotal[]>
  );
}

/** Date to prefill when adding an expense from a summary slide. */
export function getAddExpenseDate(period: SummaryPeriod, now: Date = new Date()): string {
  if (period === 'yesterday') {
    return addDays(startOfDay(now), -1).toISOString();
  }
  return now.toISOString();
}
