import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDebtRows, parseDebtRowsWithDetails, StorageParseError } from '../src/storage/debt-rows.ts';

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'debt-1',
    personName: 'Sam',
    amount: 20,
    type: 'lent',
    date: '2026-09-01T12:00:00.000Z',
    status: 'active',
    note: '',
    ...overrides,
  };
}

test('a valid debt ledger round-trips unchanged', () => {
  const debts = [row(), row({ id: 'debt-2', type: 'borrowed', status: 'settled' })];
  const parsed = parseDebtRows(JSON.stringify(debts));

  assert.deepEqual(parsed, debts);
});

test('one corrupt row does not discard the rest of the ledger', () => {
  const parsed = parseDebtRows(JSON.stringify([
    row({ id: 'debt-1' }),
    row({ id: 'debt-2', personName: '   ' }),
    row({ id: 'debt-3' }),
  ]));

  assert.deepEqual(parsed.map((debt) => debt.id), ['debt-1', 'debt-3']);
});

test('rows with an unknown type, status or date are dropped', () => {
  const parsed = parseDebtRows(JSON.stringify([
    row({ id: 'a', type: 'gifted' }),
    row({ id: 'b', status: 'pending' }),
    row({ id: 'c', date: 'not-a-date' }),
    row({ id: 'd', amount: 'lots' }),
    row({ id: 'e' }),
  ]));

  assert.deepEqual(parsed.map((debt) => debt.id), ['e']);
});

test('parseDebtRowsWithDetails reports correct dropped count', () => {
  const result = parseDebtRowsWithDetails(JSON.stringify([
    row({ id: 'debt-1' }),
    row({ id: 'debt-2', personName: '   ' }),
  ]));

  assert.equal(result.dropped, 1);
  assert.equal(result.rows.length, 1);
});

test('parseDebtRowsWithDetails throws StorageParseError on bad JSON', () => {
  assert.throws(() => parseDebtRowsWithDetails('not json'), StorageParseError);
});

test('unparseable JSON throws StorageParseError', () => {
  assert.throws(() => parseDebtRows('not json at all'), StorageParseError);
});

test('a JSON payload that is not a list throws StorageParseError', () => {
  assert.throws(() => parseDebtRows('{"debts":[]}'), StorageParseError);
});
