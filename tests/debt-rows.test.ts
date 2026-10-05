import assert from 'node:assert/strict';
import test from 'node:test';

import { parseDebtRows } from '../src/storage/debt-rows.ts';

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

test('unparseable JSON yields an empty ledger instead of throwing', () => {
  assert.deepEqual(parseDebtRows('not json at all'), []);
});

test('a JSON payload that is not a list yields an empty ledger', () => {
  assert.deepEqual(parseDebtRows('{"debts":[]}'), []);
});