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
  note TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_income_date
ON income_transactions (date DESC);
`;

let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function openAndPrepare(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await db.execAsync(SCHEMA_SQL);
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
