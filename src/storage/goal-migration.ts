/**
 * Pure helpers describing the `money_goals` schema and the one-time rebuilds
 * that keep older databases compatible: `deadline_date` must be nullable for
 * flexible pots, and `target_amount` must allow `0` for pots without a target.
 *
 * This module deliberately imports nothing native, so the exact SQL executed by
 * `db.ts` can be exercised in unit tests with the built-in SQLite engine.
 */

export interface SqliteTableInfoColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/**
 * Canonical column order for `money_goals`. Shared by fresh installs and by the
 * rebuild so a migrated database and a freshly created one are identical.
 */
export const MONEY_GOALS_COLUMN_NAMES = [
  'id',
  'title',
  'target_amount',
  'start_date',
  'deadline_date',
  'frequency',
  'status',
  'pot_type',
  'allocation_type',
  'allocation_percent',
  'icon',
] as const;

const MONEY_GOALS_COLUMNS_SQL = `
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  target_amount REAL NOT NULL DEFAULT 0 CHECK (target_amount >= 0),
  start_date TEXT NOT NULL,
  deadline_date TEXT,
  frequency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  pot_type TEXT NOT NULL DEFAULT 'general',
  allocation_type TEXT NOT NULL DEFAULT 'manual',
  allocation_percent REAL,
  icon TEXT NOT NULL DEFAULT 'piggy-bank'
`;

/** DDL for the goal table. `deadline_date` is nullable to support flexible pots. */
export function createMoneyGoalsTableSql(tableName: string): string {
  return `CREATE TABLE IF NOT EXISTS ${tableName} (${MONEY_GOALS_COLUMNS_SQL})`;
}

/**
 * True only when the live table still enforces `NOT NULL` on `deadline_date`
 * (the legacy schema). A fresh install, or one already migrated, returns false.
 */
export function goalDeadlineNeedsNullableMigration(
  tableInfo: readonly SqliteTableInfoColumn[]
): boolean {
  const column = tableInfo.find((entry) => entry.name === 'deadline_date');
  if (!column) return false;
  return column.notnull === 1;
}

/**
 * True only when the live table still rejects a zero target via
 * `CHECK (target_amount > 0)`. A fresh install, or one already migrated, returns
 * false.
 */
export function goalTargetNeedsOptionalMigration(tableSql: string | null | undefined): boolean {
  if (!tableSql) return false;
  return /target_amount\s+REAL\s+NOT\s+NULL\s+CHECK\s*\(\s*target_amount\s*>\s*0\s*\)/i.test(tableSql);
}

/**
 * SQLite cannot drop `NOT NULL` or `CHECK` constraints in place, so the table is
 * rebuilt: create a canonical copy, move every row across by id-preserving
 * `INSERT ... SELECT`, drop the old table, and rename the copy. Data, ids and the
 * `goal_contributions` relationship (keyed by `goal_id`) are untouched.
 *
 * Must run inside a transaction; SQLite rolls back DDL on failure.
 */
export function buildGoalTableRebuildSql(): string {
  const columns = MONEY_GOALS_COLUMN_NAMES.join(', ');
  return [
    'DROP TABLE IF EXISTS money_goals_migrated;',
    `${createMoneyGoalsTableSql('money_goals_migrated')};`,
    `INSERT INTO money_goals_migrated (${columns}) SELECT ${columns} FROM money_goals;`,
    'DROP TABLE money_goals;',
    'ALTER TABLE money_goals_migrated RENAME TO money_goals;',
  ].join('\n');
}
