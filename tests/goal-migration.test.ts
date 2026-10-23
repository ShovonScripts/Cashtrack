import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';

import {
  buildGoalTableRebuildSql,
  createMoneyGoalsTableSql,
  goalDeadlineNeedsNullableMigration,
  goalTargetNeedsOptionalMigration,
  MONEY_GOALS_COLUMN_NAMES,
  type SqliteTableInfoColumn,
} from '../src/storage/goal-migration.ts';

/** The schema shipped before flexible savings pots: `deadline_date` was NOT NULL. */
const LEGACY_SCHEMA_SQL = `
  CREATE TABLE money_goals (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL CHECK (target_amount > 0),
    start_date TEXT NOT NULL,
    deadline_date TEXT NOT NULL,
    frequency TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    pot_type TEXT NOT NULL DEFAULT 'general',
    allocation_type TEXT NOT NULL DEFAULT 'manual',
    allocation_percent REAL,
    icon TEXT NOT NULL DEFAULT 'piggy-bank'
  );
  CREATE TABLE goal_contributions (
    id TEXT PRIMARY KEY NOT NULL,
    goal_id TEXT NOT NULL,
    amount REAL NOT NULL CHECK (amount > 0),
    date TEXT NOT NULL,
    note TEXT NOT NULL DEFAULT ''
  );
`;

interface GoalRecord {
  id: string;
  title: string;
  target_amount: number;
  start_date: string;
  deadline_date: string | null;
  frequency: string;
  status: string;
  pot_type: string;
  allocation_type: string;
  allocation_percent: number | null;
  icon: string;
}

function createLegacyDb(): DatabaseSync {
  const db = new DatabaseSync(':memory:');
  db.exec(LEGACY_SCHEMA_SQL);
  return db;
}

function tableInfo(db: DatabaseSync): SqliteTableInfoColumn[] {
  return db
    .prepare('PRAGMA table_info(money_goals)')
    .all() as unknown as SqliteTableInfoColumn[];
}

function tableSql(db: DatabaseSync): string {
  const row = db
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'money_goals'")
    .get() as unknown as { sql: string };
  return row.sql;
}

/** node:sqlite returns null-prototype rows; copy them so strict deep-equal compares values. */
function plain<T>(rows: unknown[]): T[] {
  return rows.map((row) => ({ ...(row as object) })) as T[];
}

function insertLegacyGoal(db: DatabaseSync, goal: GoalRecord): void {
  db.prepare(
    `INSERT INTO money_goals
      (id, title, target_amount, start_date, deadline_date, frequency, status, pot_type, allocation_type, allocation_percent, icon)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    goal.id,
    goal.title,
    goal.target_amount,
    goal.start_date,
    goal.deadline_date,
    goal.frequency,
    goal.status,
    goal.pot_type,
    goal.allocation_type,
    goal.allocation_percent,
    goal.icon
  );
}

const datedGoal: GoalRecord = {
  id: 'goal-dated-1',
  title: 'Summer Vacation',
  target_amount: 2500,
  start_date: '2026-01-01T00:00:00.000Z',
  deadline_date: '2026-07-01T00:00:00.000Z',
  frequency: 'monthly',
  status: 'active',
  pot_type: 'dream',
  allocation_type: 'manual',
  allocation_percent: null,
  icon: 'star-shooting',
};

test('legacy NOT NULL deadline is detected, nullable and missing columns are not', () => {
  const legacy = createLegacyDb();
  assert.equal(goalDeadlineNeedsNullableMigration(tableInfo(legacy)), true);

  const fresh = new DatabaseSync(':memory:');
  fresh.exec(createMoneyGoalsTableSql('money_goals'));
  assert.equal(goalDeadlineNeedsNullableMigration(tableInfo(fresh)), false);

  assert.equal(goalDeadlineNeedsNullableMigration([]), false);
});

test('legacy zero-rejecting target CHECK is detected, canonical and missing tables are not', () => {
  const legacy = createLegacyDb();
  assert.equal(goalTargetNeedsOptionalMigration(tableSql(legacy)), true);

  const fresh = new DatabaseSync(':memory:');
  fresh.exec(createMoneyGoalsTableSql('money_goals'));
  assert.equal(goalTargetNeedsOptionalMigration(tableSql(fresh)), false);

  assert.equal(goalTargetNeedsOptionalMigration(null), false);
  assert.equal(goalTargetNeedsOptionalMigration(''), false);
});

test('legacy schema rejects a flexible goal (documents the bug being fixed)', () => {
  const db = createLegacyDb();
  assert.throws(
    () => insertLegacyGoal(db, { ...datedGoal, id: 'goal-flex', deadline_date: null }),
    /NOT NULL constraint failed: money_goals\.deadline_date/
  );
});

test('migration preserves existing goals and contributions and enables flexible pots', () => {
  const db = createLegacyDb();
  insertLegacyGoal(db, datedGoal);
  insertLegacyGoal(db, {
    ...datedGoal,
    id: 'goal-dated-2',
    title: 'New Laptop',
    target_amount: 1200,
    deadline_date: '2026-03-01T00:00:00.000Z',
  });
  db.prepare(
    "INSERT INTO goal_contributions (id, goal_id, amount, date, note) VALUES (?, ?, ?, ?, ?)"
  ).run('contrib-1', 'goal-dated-1', 300, '2026-02-01T00:00:00.000Z', 'first');

  db.exec(buildGoalTableRebuildSql());

  const goals = plain<GoalRecord>(db.prepare('SELECT * FROM money_goals ORDER BY id').all());
  assert.deepEqual(goals, [
    datedGoal,
    { ...datedGoal, id: 'goal-dated-2', title: 'New Laptop', target_amount: 1200, deadline_date: '2026-03-01T00:00:00.000Z' },
  ]);

  const contributions = plain<{ id: string; goal_id: string; amount: number; note: string }>(
    db.prepare('SELECT id, goal_id, amount, note FROM goal_contributions').all()
  );
  assert.deepEqual(contributions, [
    { id: 'contrib-1', goal_id: 'goal-dated-1', amount: 300, note: 'first' },
  ]);

  // column set and nullability now match a fresh install
  const info = tableInfo(db);
  assert.deepEqual(info.map((c) => c.name), [...MONEY_GOALS_COLUMN_NAMES]);
  assert.equal(info.find((c) => c.name === 'deadline_date')?.notnull, 0);

  // flexible pot now saves
  insertLegacyGoal(db, { ...datedGoal, id: 'goal-flex', deadline_date: null });
  const flexible = db
    .prepare('SELECT deadline_date FROM money_goals WHERE id = ?')
    .get('goal-flex') as unknown as { deadline_date: string | null };
  assert.equal(flexible.deadline_date, null);
});

test('migration is idempotent and safe to run repeatedly', () => {
  const db = createLegacyDb();
  insertLegacyGoal(db, datedGoal);

  db.exec(buildGoalTableRebuildSql());
  assert.equal(goalDeadlineNeedsNullableMigration(tableInfo(db)), false);
  db.exec(buildGoalTableRebuildSql());

  const goals = plain<GoalRecord>(db.prepare('SELECT * FROM money_goals').all());
  assert.deepEqual(goals, [datedGoal]);
});

test('fresh schema allows a NULL deadline out of the box', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(createMoneyGoalsTableSql('money_goals'));
  assert.doesNotThrow(() =>
    insertLegacyGoal(db, { ...datedGoal, id: 'goal-flex', deadline_date: null })
  );
});

test('fresh schema allows a zero target for open-ended pots', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(createMoneyGoalsTableSql('money_goals'));
  assert.doesNotThrow(() =>
    insertLegacyGoal(db, { ...datedGoal, id: 'goal-open', target_amount: 0 })
  );
});

test('migration enables zero-target pots while preserving existing rows', () => {
  const db = createLegacyDb();
  insertLegacyGoal(db, datedGoal);
  assert.throws(
    () => insertLegacyGoal(db, { ...datedGoal, id: 'goal-open', target_amount: 0 }),
    /CHECK constraint failed/
  );

  db.exec(buildGoalTableRebuildSql());

  insertLegacyGoal(db, { ...datedGoal, id: 'goal-open', target_amount: 0 });
  const goals = plain<GoalRecord>(db.prepare('SELECT * FROM money_goals ORDER BY id').all());
  assert.equal(goals.length, 2);
  assert.equal(goals.find((goal) => goal.id === 'goal-open')?.target_amount, 0);
  assert.equal(goalTargetNeedsOptionalMigration(tableSql(db)), false);
});

test('a failure during the migration transaction rolls back and preserves every row', () => {
  const db = createLegacyDb();
  insertLegacyGoal(db, datedGoal);

  // Mirrors expo-sqlite's withTransactionAsync (BEGIN / callback / COMMIT | ROLLBACK).
  db.exec('BEGIN;');
  try {
    db.exec(buildGoalTableRebuildSql());
    db.exec('THIS STATEMENT IS INVALID;');
  } catch {
    db.exec('ROLLBACK;');
  }

  const goals = plain<GoalRecord>(db.prepare('SELECT * FROM money_goals').all());
  assert.deepEqual(goals, [datedGoal]);
  // The legacy schema is untouched, so the migration can safely retry next launch.
  assert.equal(goalDeadlineNeedsNullableMigration(tableInfo(db)), true);
});
