import assert from 'node:assert/strict';
import test from 'node:test';

import { nextRecurringDate, processRecurringExpenses } from '../src/utils/recurring.ts';
import type { Expense } from '../src/types/expense.ts';

/**
 * Recurrence arithmetic works in local time (getFullYear/getMonth/setFullYear), so the
 * tests build local dates rather than ISO UTC strings. An ISO anchor can land on a
 * different day-of-month depending on the runner's timezone.
 */
function local(year: number, monthIndex: number, day: number, hours = 12, minutes = 0): Date {
  return new Date(year, monthIndex, day, hours, minutes, 0, 0);
}

/** Walks a template forward and returns the local YYYY-MM-DD of each occurrence. */
function occurrences(
  anchor: Date,
  freq: 'weekly' | 'monthly' | 'yearly',
  steps: number,
): string[] {
  let current = new Date(anchor);
  const days: string[] = [];
  for (let i = 0; i < steps; i += 1) {
    current = nextRecurringDate(anchor, current, freq);
    const month = String(current.getMonth() + 1).padStart(2, '0');
    days.push(`${current.getFullYear()}-${month}-${String(current.getDate()).padStart(2, '0')}`);
  }
  return days;
}

test('a template on the 31st clamps to February and then returns to the 31st', () => {
  // February 2026 has 28 days, so Jan 31 must clamp rather than overflow to Mar 3.
  assert.deepEqual(occurrences(local(2026, 0, 31), 'monthly', 3), [
    '2026-02-28',
    '2026-03-31',
    '2026-04-30',
  ]);
});

test('a leap-year anchor on the 31st clamps to the 29th in February', () => {
  assert.deepEqual(occurrences(local(2028, 0, 31), 'monthly', 2), [
    '2028-02-29',
    '2028-03-31',
  ]);
});

test('the 30th clamps to the 28th and returns to the 30th', () => {
  assert.deepEqual(occurrences(local(2026, 3, 30), 'monthly', 2), [
    '2026-05-30',
    '2026-06-30',
  ]);
});

test('a monthly series never slides off its anchor day', () => {
  const anchor = local(2025, 0, 31);
  const days = occurrences(anchor, 'monthly', 24).map((day) => {
    const [year, month, dayOfMonth] = day.split('-').map(Number);
    return { year, monthIndex: month - 1, dayOfMonth, lastDay: new Date(year, month, 0).getDate() };
  });

  // Every occurrence must be the 31st, or the last day of a shorter month.
  const offSeries = days.filter(({ dayOfMonth, lastDay }) => dayOfMonth !== 31 && dayOfMonth !== lastDay);
  assert.deepEqual(offSeries, []);

  // And it must come back to the 31st every time a 31-day month comes round.
  assert.ok(days.some(({ year, monthIndex, dayOfMonth }) => year === 2025 && monthIndex === 2 && dayOfMonth === 31));
});

test('a yearly Feb 29 anchor clamps to the 28th in common years', () => {
  assert.deepEqual(occurrences(local(2024, 1, 29), 'yearly', 3), [
    '2025-02-28',
    '2026-02-28',
    '2027-02-28',
  ]);
});

test('a yearly anchor keeps its month and day when nothing needs clamping', () => {
  assert.deepEqual(occurrences(local(2026, 2, 15), 'yearly', 2), [
    '2027-03-15',
    '2028-03-15',
  ]);
});

test('weekly occurrences advance exactly seven days and never drift', () => {
  assert.deepEqual(occurrences(local(2026, 0, 31), 'weekly', 3), [
    '2026-02-07',
    '2026-02-14',
    '2026-02-21',
  ]);
});

test('the time of day is preserved across a clamp', () => {
  const anchor = local(2026, 0, 31, 18, 45);
  const next = nextRecurringDate(anchor, new Date(anchor), 'monthly');

  assert.equal(next.getDate(), 28);
  assert.equal(next.getHours(), 18);
  assert.equal(next.getMinutes(), 45);
});

test('a 31st monthly template generates Feb 28 and Mar 31 instances', () => {
  const template: Expense = {
    id: 'template-1',
    amount: 30,
    category: 'Bills',
    date: local(2026, 0, 31).toISOString(),
    note: 'Rent',
    isRecurring: true,
    recurringFrequency: 'monthly',
  };

  const children = processRecurringExpenses([template])
    .filter((expense) => expense.recurringParentId === 'template-1')
    .map((expense) => {
      const date = new Date(expense.date);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    });

  assert.ok(children.includes('2026-02-28'), `expected a Feb 28 instance, got ${children.join(', ')}`);
  assert.ok(children.includes('2026-03-31'), `expected a Mar 31 instance, got ${children.join(', ')}`);
  assert.ok(!children.includes('2026-03-03'), 'the series must not slide to the 3rd');
});

test('generated instances are not duplicated across repeated runs', () => {
  const template: Expense = {
    id: 'template-2',
    amount: 10,
    category: 'Bills',
    date: local(2025, 0, 31).toISOString(),
    note: 'Sub',
    isRecurring: true,
    recurringFrequency: 'monthly',
  };

  const first = processRecurringExpenses([template]);
  const second = processRecurringExpenses(first);

  const ids = second.map((expense) => expense.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('the template row itself is untouched', () => {
  const template: Expense = {
    id: 'template-3',
    amount: 30,
    category: 'Bills',
    date: local(2026, 0, 31).toISOString(),
    note: 'Rent',
    isRecurring: true,
    recurringFrequency: 'monthly',
  };

  const after = processRecurringExpenses([template]);
  const kept = after.find((expense) => expense.id === 'template-3');

  assert.deepEqual(kept, template);
});