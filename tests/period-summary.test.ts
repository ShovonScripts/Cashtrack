import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCategoryBreakdowns,
  buildCostSummaries,
  filterExpensesByPeriod,
  getAddExpenseDate,
  getCategoryTotals,
  getPeriodRange,
  getPeriodRangeLabel,
  type SummaryPeriod,
} from '../src/utils/period-summary.ts';
import type { Expense } from '../src/types/expense.ts';

function makeExpense(amount: number, date: Date, category = 'Food'): Expense {
  return {
    id: `expense-${category}-${amount}-${date.getTime()}`,
    amount,
    category,
    date: date.toISOString(),
    note: '',
  };
}

function localDate(year: number, monthIndex: number, day: number): Date {
  return new Date(year, monthIndex, day, 12, 0, 0);
}

function assertRange(
  period: SummaryPeriod,
  now: Date,
  firstDay: 'monday' | 'sunday',
  expectedStart: Date,
  expectedEnd: Date
) {
  const range = getPeriodRange(period, now, firstDay);
  assert.equal(range.start.toDateString(), expectedStart.toDateString());
  assert.equal(range.end.toDateString(), expectedEnd.toDateString());
}

test('daily range covers the current local calendar day', () => {
  assertRange('daily', localDate(2026, 9, 20), 'monday', localDate(2026, 9, 20), localDate(2026, 9, 21));
});

test('yesterday range covers the previous local calendar day', () => {
  assertRange('yesterday', localDate(2026, 9, 20), 'monday', localDate(2026, 9, 19), localDate(2026, 9, 20));
});

test('weekly range starts on Monday when Monday is the first day', () => {
  assertRange('weekly', localDate(2026, 9, 20), 'monday', localDate(2026, 9, 19), localDate(2026, 9, 26));
});

test('weekly range starts on Sunday when Sunday is the first day', () => {
  assertRange('weekly', localDate(2026, 9, 20), 'sunday', localDate(2026, 9, 18), localDate(2026, 9, 25));
});

test('weekly range stays correct on a Monday', () => {
  assertRange('weekly', localDate(2026, 9, 19), 'monday', localDate(2026, 9, 19), localDate(2026, 9, 26));
});

test('weekly range stays correct on a Sunday', () => {
  assertRange('weekly', localDate(2026, 9, 25), 'sunday', localDate(2026, 9, 25), localDate(2026, 10, 1));
});

test('weekly range can cross a year boundary', () => {
  assertRange('weekly', localDate(2025, 11, 30), 'monday', localDate(2025, 11, 29), localDate(2026, 0, 5));
});

test('monthly range covers the whole calendar month', () => {
  assertRange('monthly', localDate(2026, 1, 14), 'monday', localDate(2026, 1, 1), localDate(2026, 2, 1));
});

test('monthly range handles February in a leap year', () => {
  assertRange('monthly', localDate(2028, 1, 10), 'monday', localDate(2028, 1, 1), localDate(2028, 2, 1));
});

test('yearly range covers the calendar year', () => {
  assertRange('yearly', localDate(2026, 9, 20), 'monday', localDate(2026, 0, 1), localDate(2027, 0, 1));
});

test('expense filtering uses half-open period boundaries', () => {
  const now = localDate(2026, 9, 20);
  const expenses = [
    makeExpense(10, new Date(2026, 9, 19, 0, 0, 0)),
    makeExpense(20, new Date(2026, 9, 19, 23, 59, 59)),
    makeExpense(30, new Date(2026, 9, 20, 0, 0, 0)),
  ];

  const daily = filterExpensesByPeriod(expenses, 'daily', now, 'monday');
  assert.deepEqual(daily.map((expense) => expense.amount), [30]);

  const yesterday = filterExpensesByPeriod(expenses, 'yesterday', now, 'monday');
  assert.deepEqual(yesterday.map((expense) => expense.amount), [10, 20]);
});

test('weekly totals include only the selected calendar week', () => {
  const now = localDate(2026, 9, 20);
  const expenses = [
    makeExpense(10, localDate(2026, 9, 18)),
    makeExpense(20, localDate(2026, 9, 19)),
    makeExpense(30, localDate(2026, 9, 20)),
    makeExpense(40, localDate(2026, 9, 26)),
  ];

  const mondayWeek = filterExpensesByPeriod(expenses, 'weekly', now, 'monday');
  assert.equal(mondayWeek.reduce((total, expense) => total + expense.amount, 0), 50);

  const sundayWeek = filterExpensesByPeriod(expenses, 'weekly', now, 'sunday');
  assert.equal(sundayWeek.reduce((total, expense) => total + expense.amount, 0), 60);
});

test('category totals are sorted and scoped to the active period', () => {
  const now = localDate(2026, 9, 20);
  const expenses = [
    makeExpense(100, localDate(2026, 9, 20), 'Food'),
    makeExpense(300, localDate(2026, 9, 20), 'Transport'),
    makeExpense(100, localDate(2026, 9, 19), 'Transport'),
    makeExpense(200, localDate(2026, 8, 15), 'Food'),
  ];

  const daily = getCategoryTotals(expenses, 'daily', now, 'monday');
  assert.deepEqual(daily.map((item) => item.category), ['Transport', 'Food']);
  assert.deepEqual(daily.map((item) => item.amount), [300, 100]);
  assert.equal(Math.round(daily[0]?.percent ?? 0), 75);

  const weekly = getCategoryTotals(expenses, 'weekly', now, 'monday');
  assert.deepEqual(weekly.map((item) => item.amount), [400, 100]);

  const yearly = getCategoryTotals(expenses, 'yearly', now, 'monday');
  assert.deepEqual(yearly.map((item) => item.amount), [400, 300]);
});

test('category breakdowns cover every carousel period and stay empty without expenses', () => {
  const now = localDate(2026, 9, 20);
  const breakdowns = buildCategoryBreakdowns([], now, 'monday');

  assert.deepEqual(Object.keys(breakdowns), ['yesterday', 'daily', 'weekly', 'monthly', 'yearly']);
  assert.deepEqual(breakdowns.daily, []);
  assert.deepEqual(breakdowns.yearly, []);
});

test('cost summaries are ordered with Daily in the middle of the slide list', () => {
  const summaries = buildCostSummaries([], localDate(2026, 9, 20), 'monday');
  assert.deepEqual(
    summaries.map((summary) => summary.period),
    ['yesterday', 'daily', 'weekly', 'monthly', 'yearly']
  );
  assert.equal(summaries[1]?.title, 'DAILY COST');
  assert.equal(summaries[1]?.amount, 0);
});

test('range labels describe the visible period', () => {
  const now = localDate(2026, 9, 20);
  assert.equal(getPeriodRangeLabel('weekly', now, 'monday'), '19 – 25 Oct');
  assert.equal(getPeriodRangeLabel('weekly', now, 'sunday'), '18 – 24 Oct');
  assert.equal(getPeriodRangeLabel('monthly', now, 'monday'), 'October 2026');
  assert.equal(getPeriodRangeLabel('yearly', now, 'monday'), '2026');
});

test('add expense prefill uses yesterday only for the yesterday slide', () => {
  const now = localDate(2026, 9, 20);
  assert.equal(new Date(getAddExpenseDate('yesterday', now)).toDateString(), localDate(2026, 9, 19).toDateString());
  assert.equal(new Date(getAddExpenseDate('daily', now)).toDateString(), now.toDateString());
});
