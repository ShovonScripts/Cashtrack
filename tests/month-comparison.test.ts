import assert from 'node:assert/strict';
import test from 'node:test';

import { compareMonths } from '../src/utils/month-comparison.ts';

// Local-time dates so the test does not depend on the machine's timezone.
function iso(year: number, month: number, day: number): string {
  return new Date(year, month - 1, day, 12).toISOString();
}

const expenses = [
  { amount: 100, category: 'Food', date: iso(2026, 9, 5) },
  { amount: 50, category: 'Transport', date: iso(2026, 9, 20) },
  { amount: 200, category: 'Food', date: iso(2026, 10, 3) },
  { amount: 30, category: 'Fun', date: iso(2026, 10, 10) },
  { amount: 500, category: 'Bills', date: iso(2026, 10, 25) },
];

test('a finished month is compared with the whole previous month', () => {
  const result = compareMonths(expenses, new Date(2026, 9, 1, 12), new Date(2026, 10, 15, 12));
  assert.equal(result.current, 730);
  assert.equal(result.previous, 150);
  assert.equal(result.delta, 580);
  assert.equal(result.direction, 'up');
  assert.equal(result.percent, 387);
  assert.equal(result.throughDay, null);
});

test('a month in progress is cut off at the same day in both months', () => {
  // On Oct 12 only spending up to the 12th counts, in both October and September.
  const result = compareMonths(expenses, new Date(2026, 9, 1, 12), new Date(2026, 9, 12, 12));
  assert.equal(result.throughDay, 12);
  assert.equal(result.current, 230);
  assert.equal(result.previous, 100);
  assert.equal(result.direction, 'up');
});

test('movers are ordered by size of change, and unchanged categories are left out', () => {
  const result = compareMonths(expenses, new Date(2026, 9, 1, 12), new Date(2026, 10, 15, 12));
  assert.deepEqual(
    result.movers.map((m) => m.category),
    ['Bills', 'Food', 'Transport']
  );
  const food = result.movers.find((m) => m.category === 'Food');
  assert.equal(food?.delta, 100);
});

test('top categories carry their share of the total', () => {
  const result = compareMonths(expenses, new Date(2026, 9, 1, 12), new Date(2026, 10, 15, 12));
  assert.equal(result.topCategories[0].category, 'Bills');
  assert.equal(result.topCategories[0].share, 68);
});

test('nothing before this month is reported as new, and no history gives no percent', () => {
  const result = compareMonths([{ amount: 40, category: 'Food', date: iso(2026, 10, 2) }], new Date(2026, 9, 1, 12), new Date(2026, 10, 15, 12));
  assert.equal(result.direction, 'new');
  assert.equal(result.percent, null);
});

test('equal spending is flat, and empty history does not throw', () => {
  const flat = compareMonths(
    [
      { amount: 40, category: 'Food', date: iso(2026, 9, 2) },
      { amount: 40, category: 'Food', date: iso(2026, 10, 2) },
    ],
    new Date(2026, 9, 1, 12),
    new Date(2026, 10, 15, 12)
  );
  assert.equal(flat.direction, 'flat');
  assert.equal(compareMonths([], new Date(2026, 9, 1, 12)).current, 0);
});
