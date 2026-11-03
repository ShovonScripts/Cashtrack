import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import {
  buildGoalContributionsRebuildSql,
  buildReminderPaymentsRebuildSql,
  hasForeignKey,
  type ForeignKeyInfo,
} from '../src/storage/relational-migration.ts';

const LEGACY_SCHEMA_SQL = `
  CREATE TABLE income_transactions (
    id TEXT PRIMARY KEY NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE money_goals (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    deadline_date TEXT,
    frequency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );
  CREATE TABLE goal_contributions (
    id TEXT PRIMARY KEY NOT NULL,
    goal_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT '',
    source_income_id TEXT
  );
  CREATE TABLE financial_reminders (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL
  );
  CREATE TABLE reminder_payments (
    id TEXT PRIMARY KEY NOT NULL,
    reminder_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    paid_date TEXT NOT NULL,
    expense_id TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL
  );
`;

function createLegacyDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(LEGACY_SCHEMA_SQL);
  db.exec("INSERT INTO income_transactions (id, amount, date) VALUES ('income-1', 100, '2026-10-01');");
  db.exec("INSERT INTO money_goals (id, title, start_date, frequency) VALUES ('goal-1', 'Trip', '2026-10-01', 'monthly');");
  db.exec("INSERT INTO financial_reminders (id, title) VALUES ('reminder-1', 'Rent');");
  return db;
}

function foreignKeys(db: DatabaseSync, table: string): ForeignKeyInfo[] {
  return db
    .prepare(`PRAGMA foreign_key_list(${table})`)
    .all() as unknown as ForeignKeyInfo[];
}

test('hasForeignKey matches the child column and parent table', () => {
  const keys = [
    { id: 0, seq: 0, table: 'money_goals', from: 'goal_id', to: 'id', on_update: 'NO ACTION', on_delete: 'CASCADE', match: 'NONE' },
  ];
  assert.equal(hasForeignKey(keys, 'goal_id', 'money_goals'), true);
  assert.equal(hasForeignKey(keys, 'goal_id', 'income_transactions'), false);
  assert.equal(hasForeignKey(keys, 'source_income_id', 'money_goals'), false);
});

test('goal contributions rebuild preserves rows and adds a cascading key', () => {
  const db = createLegacyDb();
  db.exec(`
    INSERT INTO goal_contributions (id, goal_id, amount, date, note, source_income_id) VALUES
      ('contribution-1', 'goal-1', 25, '2026-10-02', 'valid', 'income-1'),
      ('contribution-2', 'missing-goal', 10, '2026-10-03', 'orphan goal', NULL),
      ('contribution-3', 'goal-1', 5, '2026-10-04', 'orphan income', 'missing-income');
  `);

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(buildGoalContributionsRebuildSql());
  db.exec('PRAGMA foreign_keys = ON;');

  const rows = db.prepare('SELECT id, goal_id FROM goal_contributions ORDER BY id').all() as unknown as {
    id: string;
    goal_id: string;
  }[];
  assert.deepEqual(rows.map((row) => ({ ...row })), [
    { id: 'contribution-1', goal_id: 'goal-1' },
    { id: 'contribution-2', goal_id: 'missing-goal' },
    { id: 'contribution-3', goal_id: 'goal-1' },
  ]);

  const keys = foreignKeys(db, 'goal_contributions');
  assert.equal(hasForeignKey(keys, 'goal_id', 'money_goals'), true);
  assert.equal(hasForeignKey(keys, 'source_income_id', 'income_transactions'), true);

  db.exec("DELETE FROM money_goals WHERE id = 'goal-1';");
  const remaining = db.prepare('SELECT id FROM goal_contributions ORDER BY id').all() as unknown as {
    id: string;
  }[];
  assert.deepEqual(remaining.map((row) => ({ ...row })), [{ id: 'contribution-2' }]);
});

test('reminder payments rebuild preserves rows and adds a cascading key', () => {
  const db = createLegacyDb();
  db.exec(`
    INSERT INTO reminder_payments (id, reminder_id, amount, paid_date, created_at) VALUES
      ('payment-1', 'reminder-1', 20, '2026-10-02', '2026-10-02T10:00:00.000Z'),
      ('payment-2', 'missing-reminder', 20, '2026-10-03', '2026-10-03T10:00:00.000Z');
  `);

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec(buildReminderPaymentsRebuildSql());
  db.exec('PRAGMA foreign_keys = ON;');

  const rows = db.prepare('SELECT id, reminder_id FROM reminder_payments ORDER BY id').all() as unknown as {
    id: string;
    reminder_id: string;
  }[];
  assert.deepEqual(rows.map((row) => ({ ...row })), [
    { id: 'payment-1', reminder_id: 'reminder-1' },
    { id: 'payment-2', reminder_id: 'missing-reminder' },
  ]);

  const keys = foreignKeys(db, 'reminder_payments');
  assert.equal(hasForeignKey(keys, 'reminder_id', 'financial_reminders'), true);

  db.exec("DELETE FROM financial_reminders WHERE id = 'reminder-1';");
  const remaining = db.prepare('SELECT id FROM reminder_payments ORDER BY id').all() as unknown as {
    id: string;
  }[];
  assert.deepEqual(remaining.map((row) => ({ ...row })), [{ id: 'payment-2' }]);
});
