import assert from 'node:assert/strict';
import test from 'node:test';

import { isDemoExpense, parseExpenseRows, parseExpenseRowsWithDetails, StorageParseError } from '../src/storage/expense-rows.ts';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'expense-1',
    amount: 42,
    category: 'Food',
    date: '2026-09-29T12:00:00.000Z',
    note: 'Lunch',
    ...overrides,
  };
}

test('a valid ledger round-trips unchanged', () => {
  const expenses = [row(), row({ id: 'expense-2', amount: 7 })];
  const parsed = parseExpenseRows(JSON.stringify(expenses));

  assert.deepEqual(parsed, expenses);
});

test('one corrupt row does not discard the rest of the ledger', () => {
  const expenses = [
    row({ id: 'expense-1' }),
    row({ id: 'expense-2', amount: 'not a number' }),
    row({ id: 'expense-3' }),
  ];

  const parsed = parseExpenseRows(JSON.stringify(expenses));

  assert.deepEqual(parsed.map((expense) => expense.id), ['expense-1', 'expense-3']);
});

test('rows with unusable dates, categories and ids are dropped', () => {
  const parsed = parseExpenseRows(JSON.stringify([
    row({ id: 'a', date: 'not-a-date' }),
    row({ id: 'b', category: '   ' }),
    row({ id: '' }),
    row({ id: 'c', amount: Number.NaN }),
    row({ id: 'd' }),
    null,
    'nonsense',
    42,
  ]));

  assert.deepEqual(parsed.map((expense) => expense.id), ['d']);
});

test('unparseable JSON throws StorageParseError', () => {
  assert.throws(() => parseExpenseRows('{ this is not json'), StorageParseError);
});

test('a JSON payload that is not a list throws StorageParseError', () => {
  assert.throws(() => parseExpenseRows('{"expenses":[]}'), StorageParseError);
  assert.throws(() => parseExpenseRows('null'), StorageParseError);
});

test('parseExpenseRowsWithDetails reports correct dropped count and ignores demo rows in drop count', () => {
  const result = parseExpenseRowsWithDetails(JSON.stringify([
    row({ id: 'demo-expense-1' }),
    row({ id: 'expense-1' }),
    row({ id: 'expense-2', amount: 'bad' }),
    row({ id: 'expense-3' }),
  ]));

  assert.equal(result.dropped, 1);
  assert.equal(result.rows.length, 2);
});

test('parseExpenseRowsWithDetails throws StorageParseError on bad JSON', () => {
  assert.throws(() => parseExpenseRowsWithDetails('not json'), StorageParseError);
});

test('first-launch demo rows are stripped using their real id prefix', () => {
  assert.ok(isDemoExpense('demo-expense-1'));
  assert.ok(!isDemoExpense('seed-1'));

  const parsed = parseExpenseRows(JSON.stringify([
    row({ id: 'demo-expense-1' }),
    row({ id: 'demo-expense-8' }),
    row({ id: 'expense-real' }),
  ]));

  assert.deepEqual(parsed.map((expense) => expense.id), ['expense-real']);
});

test('an empty stored array stays empty and is not treated as absent', () => {
  assert.deepEqual(parseExpenseRows('[]'), []);
});
