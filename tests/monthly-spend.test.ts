import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import type { Expense } from '../src/types/expense.ts';
import { getMonthlySpendTotals } from '../src/utils/monthly-spend.ts';

function makeExpense(amount: number, date: string): Expense {
  return {
    id: `${amount}-${date}`,
    amount,
    category: 'Food',
    date,
    note: 'test',
  };
}

const localIso = (year: number, monthIndex: number, day: number, hour = 12) =>
  new Date(year, monthIndex, day, hour).toISOString();

describe('getMonthlySpendTotals', () => {
  test('returns twelve months with January at index 0', () => {
    const totals = getMonthlySpendTotals([], 2026);
    assert.equal(totals.length, 12);
    assert.deepEqual(totals, [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  test('adds every expense of the month together', () => {
    const totals = getMonthlySpendTotals(
      [
        makeExpense(10, localIso(2026, 0, 3)),
        makeExpense(15.5, localIso(2026, 0, 20)),
        makeExpense(7, localIso(2026, 6, 1)),
      ],
      2026
    );
    assert.equal(totals[0], 25.5);
    assert.equal(totals[6], 7);
    assert.equal(totals[11], 0);
  });

  test('ignores expenses from other years', () => {
    const totals = getMonthlySpendTotals(
      [
        makeExpense(99, localIso(2025, 5, 10)),
        makeExpense(5, localIso(2027, 0, 2)),
        makeExpense(3, localIso(2026, 5, 10)),
      ],
      2026
    );
    assert.equal(totals[5], 3);
    assert.equal(
      totals.reduce((sum, value) => sum + value, 0),
      3
    );
  });

  test('uses local calendar months at day boundaries', () => {
    const totals = getMonthlySpendTotals(
      [
        makeExpense(1, localIso(2026, 1, 28, 23)),
        makeExpense(2, localIso(2026, 2, 1, 0)),
      ],
      2026
    );
    assert.equal(totals[1], 1);
    assert.equal(totals[2], 2);
  });
});
