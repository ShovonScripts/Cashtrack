import assert from 'node:assert/strict';
import test from 'node:test';

import { getRecentCategories } from '../src/utils/recent-categories.ts';

const valid = ['Food', 'Transport', 'Bills', 'Fun', 'Health'];

test('returns distinct categories, newest first', () => {
  const expenses = [
    { category: 'Food', date: '2026-10-01T10:00:00.000Z' },
    { category: 'Transport', date: '2026-10-03T10:00:00.000Z' },
    { category: 'Food', date: '2026-10-05T10:00:00.000Z' },
    { category: 'Bills', date: '2026-10-02T10:00:00.000Z' },
  ];
  assert.deepEqual(getRecentCategories(expenses, valid), ['Food', 'Transport', 'Bills']);
});

test('skips categories that no longer exist', () => {
  const expenses = [
    { category: 'Old Category', date: '2026-10-05T10:00:00.000Z' },
    { category: 'Fun', date: '2026-10-01T10:00:00.000Z' },
  ];
  assert.deepEqual(getRecentCategories(expenses, valid), ['Fun']);
});

test('respects the limit and handles an empty list', () => {
  const expenses = valid.map((category, i) => ({
    category,
    date: `2026-10-0${i + 1}T10:00:00.000Z`,
  }));
  assert.equal(getRecentCategories(expenses, valid, 2).length, 2);
  assert.deepEqual(getRecentCategories([], valid), []);
});
