/**
 * Pure helpers for the relational integrity migration. Older databases created
 * `goal_contributions` and `reminder_payments` without foreign keys, so deleting
 * a parent could leave orphan rows behind.
 *
 * This module imports nothing native so the SQL can be exercised with the
 * built-in SQLite engine in unit tests.
 */

export const RELATIONAL_SCHEMA_VERSION = 1;

export interface ForeignKeyInfo {
  id: number;
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
  match: string;
}

export function hasForeignKey(
  foreignKeys: readonly ForeignKeyInfo[],
  from: string,
  table: string,
): boolean {
  return foreignKeys.some((foreignKey) => foreignKey.from === from && foreignKey.table === table);
}

/**
 * Rebuilds `goal_contributions` with cascading foreign keys. Existing rows are
 * copied verbatim, including any pre-existing orphans: financial records are
 * never silently deleted during a migration. Enforcement applies to new writes.
 *
 * Must run with `PRAGMA foreign_keys = OFF` so the table can be replaced, then
 * the caller re-enables enforcement afterwards.
 */
export function buildGoalContributionsRebuildSql(): string {
  return [
    'DROP TABLE IF EXISTS goal_contributions_migrated;',
    `CREATE TABLE goal_contributions_migrated (
      id TEXT PRIMARY KEY NOT NULL,
      goal_id TEXT NOT NULL REFERENCES money_goals(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK (amount > 0),
      date TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      source_income_id TEXT REFERENCES income_transactions(id) ON DELETE CASCADE
    );`,
    `INSERT INTO goal_contributions_migrated (id, goal_id, amount, date, note, source_income_id)
     SELECT id, goal_id, amount, date, note, source_income_id
     FROM goal_contributions;`,
    'DROP TABLE goal_contributions;',
    'ALTER TABLE goal_contributions_migrated RENAME TO goal_contributions;',
    'CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal ON goal_contributions (goal_id, date DESC);',
  ].join('\n');
}

/**
 * Rebuilds `reminder_payments` with a cascading foreign key to its reminder.
 * Existing rows are preserved verbatim, including any pre-existing orphans.
 */
export function buildReminderPaymentsRebuildSql(): string {
  return [
    'DROP TABLE IF EXISTS reminder_payments_migrated;',
    `CREATE TABLE reminder_payments_migrated (
      id TEXT PRIMARY KEY NOT NULL,
      reminder_id TEXT NOT NULL REFERENCES financial_reminders(id) ON DELETE CASCADE,
      amount REAL NOT NULL CHECK (amount > 0),
      paid_date TEXT NOT NULL,
      expense_id TEXT,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    );`,
    `INSERT INTO reminder_payments_migrated
       (id, reminder_id, amount, paid_date, expense_id, notes, created_at)
     SELECT id, reminder_id, amount, paid_date, expense_id, notes, created_at
     FROM reminder_payments;`,
    'DROP TABLE reminder_payments;',
    'ALTER TABLE reminder_payments_migrated RENAME TO reminder_payments;',
    'CREATE INDEX IF NOT EXISTS idx_reminder_payments_reminder ON reminder_payments (reminder_id, paid_date DESC);',
  ].join('\n');
}
