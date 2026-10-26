import * as SQLite from 'expo-sqlite';

import {
  buildGoalTableRebuildSql,
  createMoneyGoalsTableSql,
  goalDeadlineNeedsNullableMigration,
  goalTargetNeedsOptionalMigration,
  type SqliteTableInfoColumn,
} from '@/storage/goal-migration';

export const DATABASE_NAME = 'cashtrack.db';

/**
 * Schema DDL. Every statement is guarded with `IF NOT EXISTS`, so running this
 * more than once is safe — on a fresh install it creates everything, and on
 * later launches it is a no-op.
 */
const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_expenses_date
ON expenses (date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_category
ON expenses (category);

CREATE TABLE IF NOT EXISTS income_transactions (
  id TEXT PRIMARY KEY NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurring_frequency TEXT,
  recurring_end_date TEXT,
  recurring_parent_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_income_date
ON income_transactions (date DESC);

${createMoneyGoalsTableSql('money_goals')};

CREATE TABLE IF NOT EXISTS goal_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  source_income_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_goal_contributions_goal
ON goal_contributions (goal_id, date DESC);

CREATE TABLE IF NOT EXISTS financial_reminders (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  amount REAL,
  is_variable_amount INTEGER NOT NULL DEFAULT 0,
  category TEXT NOT NULL,
  due_date TEXT NOT NULL,
  original_due_date TEXT,
  repeat_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming',
  notes TEXT NOT NULL DEFAULT '',
  total_amount REAL,
  installment_amount REAL,
  total_installments INTEGER,
  paid_installments INTEGER DEFAULT 0,
  paid_amount_current_cycle REAL NOT NULL DEFAULT 0,
  is_alarm INTEGER NOT NULL DEFAULT 0,
  alarm_time TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminders_duedate
ON financial_reminders (due_date ASC);

CREATE TABLE IF NOT EXISTS reminder_payments (
  id TEXT PRIMARY KEY NOT NULL,
  reminder_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  paid_date TEXT NOT NULL,
  expense_id TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reminder_payments_reminder
ON reminder_payments (reminder_id, paid_date DESC);
`;

let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndPrepare(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(SCHEMA_SQL);

  // Idempotent column additions for recurring income on existing databases
  try {
    await db.execAsync('ALTER TABLE income_transactions ADD COLUMN is_recurring INTEGER NOT NULL DEFAULT 0;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE income_transactions ADD COLUMN recurring_frequency TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE income_transactions ADD COLUMN recurring_end_date TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE income_transactions ADD COLUMN recurring_parent_id TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE financial_reminders ADD COLUMN original_due_date TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE financial_reminders ADD COLUMN is_alarm INTEGER NOT NULL DEFAULT 0;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE financial_reminders ADD COLUMN alarm_time TEXT;');
  } catch {}
  try {
    await db.execAsync('ALTER TABLE financial_reminders ADD COLUMN paid_amount_current_cycle REAL NOT NULL DEFAULT 0;');
  } catch {}
  try {
    await db.execAsync("ALTER TABLE money_goals ADD COLUMN pot_type TEXT NOT NULL DEFAULT 'general';");
  } catch {}
  try {
    await db.execAsync("ALTER TABLE money_goals ADD COLUMN allocation_type TEXT NOT NULL DEFAULT 'manual';");
  } catch {}
  try {
    await db.execAsync('ALTER TABLE money_goals ADD COLUMN allocation_percent REAL;');
  } catch {}
  try {
    await db.execAsync("ALTER TABLE money_goals ADD COLUMN icon TEXT NOT NULL DEFAULT 'piggy-bank';");
  } catch {}
  try {
    await db.execAsync('ALTER TABLE goal_contributions ADD COLUMN source_income_id TEXT;');
  } catch {}

  // Legacy databases declared `deadline_date` as NOT NULL, which blocks flexible
  // savings pots. Rebuild the table in place (data-preserving) when detected.
  await migrateGoalDeadlineNullable(db);

  // Older databases rejected `target_amount = 0`, which blocks pots with no
  // fixed target. Rebuild again only if the live table still carries that CHECK.
  await migrateGoalTargetOptional(db);

  return db;
}

/**
 * Makes `money_goals.deadline_date` nullable on databases created before the
 * flexible-pot feature. Idempotent: the rebuild only runs while the live schema
 * still reports the column as NOT NULL, and it is wrapped in a transaction so a
 * failure leaves the original table (and all rows) intact.
 */
async function migrateGoalDeadlineNullable(db: SQLite.SQLiteDatabase): Promise<void> {
  const tableInfo = await db.getAllAsync<SqliteTableInfoColumn>('PRAGMA table_info(money_goals);');
  if (!goalDeadlineNeedsNullableMigration(tableInfo)) {
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync(buildGoalTableRebuildSql());
  });
}

/**
 * Allows `target_amount = 0` (a pot without a fixed target) on databases created
 * before optional targets. Idempotent: the rebuild only runs while the live
 * table still declares `CHECK (target_amount > 0)`.
 */
async function migrateGoalTargetOptional(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ sql: string }>(
    "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'money_goals';"
  );
  if (!goalTargetNeedsOptionalMigration(row?.sql)) {
    return;
  }

  await db.withTransactionAsync(async () => {
    await db.execAsync(buildGoalTableRebuildSql());
  });
}

export function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!initPromise) {
    initPromise = openAndPrepare().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}
