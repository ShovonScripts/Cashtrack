import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createRestoreJournal,
  parseRestoreJournal,
  serializeRestoreJournal,
} from '../src/storage/restore-journal-codec.ts';
import type { BackupData } from '../src/utils/backup.ts';

const data = {
  expenses: [{ id: 'expense-1', amount: 12 }],
  preferences: { profile: { name: 'Ada' } },
  notes: [{ id: 'note-1' }],
  todos: [{ id: 'todo-1' }],
  debts: [],
  income: [{ id: 'income-1' }],
  goals: [],
  contributions: [],
  reminders: [],
  payments: [],
  recurringSkips: { expense: { 'expense-1': ['2026-01'] }, income: {} },
  attachments: {
    'file:///receipt.jpg': { mimeType: 'image/jpeg', data: 'base64-payload' },
  },
} as unknown as BackupData;

test('journal omits embedded attachment payloads but keeps their URIs', () => {
  const journal = createRestoreJournal(data, '2026-01-02T03:04:05.000Z');

  assert.equal(journal.version, 1);
  assert.equal(journal.createdAt, '2026-01-02T03:04:05.000Z');
  assert.deepEqual(journal.data.attachments, {});
  assert.deepEqual(journal.data.expenses, data.expenses);
  assert.deepEqual(journal.data.recurringSkips, data.recurringSkips);
});

test('serialized journal round-trips back into valid restore data', () => {
  const parsed = parseRestoreJournal(serializeRestoreJournal(data, '2026-01-02T03:04:05.000Z'));

  assert.ok(parsed);
  assert.deepEqual(parsed, { ...data, attachments: {} });
});

test('journal without optional todos is still accepted', () => {
  const withoutTodos = { ...data, todos: undefined } as unknown as BackupData;
  const parsed = parseRestoreJournal(serializeRestoreJournal(withoutTodos));

  assert.ok(parsed);
  assert.equal(parsed.todos, undefined);
});

test('malformed JSON is rejected', () => {
  assert.equal(parseRestoreJournal('{not json'), null);
});

test('stale journal versions are rejected', () => {
  const raw = JSON.stringify({ version: 2, createdAt: '2026-01-02T03:04:05.000Z', data });
  assert.equal(parseRestoreJournal(raw), null);
});

test('journal missing a required collection is rejected', () => {
  const missingExpenses = { ...data } as Record<string, unknown>;
  delete missingExpenses.expenses;
  const raw = JSON.stringify({ version: 1, createdAt: '2026-01-02T03:04:05.000Z', data: missingExpenses });
  assert.equal(parseRestoreJournal(raw), null);
});

test('journal with invalid preferences is rejected', () => {
  const raw = JSON.stringify({
    version: 1,
    createdAt: '2026-01-02T03:04:05.000Z',
    data: { ...data, preferences: 'nope' },
  });
  assert.equal(parseRestoreJournal(raw), null);
});
