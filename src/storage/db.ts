import * as SQLite from 'expo-sqlite';

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

CREATE TABLE IF NOT EXISTS money_goals (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL CHECK (target_amount > 0),
  start_date TEXT NOT NULL,
  deadline_date TEXT NOT NULL,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS goal_contributions (
  id TEXT PRIMARY KEY NOT NULL,
  goal_id TEXT NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  date TEXT NOT NULL,
  note TEXT NOT NULL DEFAULT ''
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

  return db;
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
