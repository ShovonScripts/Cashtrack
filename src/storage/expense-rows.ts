import type { Expense } from '@/types/expense';

/** First-launch demo rows use a distinct id prefix so they can be stripped later. */
export const DEMO_EXPENSE_ID_PREFIX = 'demo-expense-';

export function isDemoExpense(id: string): boolean {
  return id.startsWith(DEMO_EXPENSE_ID_PREFIX);
}

export function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as Partial<Expense>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    typeof candidate.note === 'string' &&
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0
  );
}

/**
 * Parses a stored expense ledger.
 *
 * Rows are validated one at a time so a single corrupt row cannot take the whole
 * ledger down with it: usable rows are kept, unusable ones are reported and skipped.
 * Anything that is not a JSON array is reported and treated as an empty ledger — the
 * caller must not fall back to seed data here, because that would overwrite the key
 * with demo rows and destroy whatever was stored.
 *
 * Legacy first-launch demo rows are dropped so they do not linger in a real ledger.
 */
export function parseExpenseRows(raw: string): Expense[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(
      '[cashtrack] The saved expenses could not be parsed as JSON. Starting from an empty ledger; the stored value is left untouched until the next save.',
      error,
    );
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error('[cashtrack] The saved expenses are not a list. Starting from an empty ledger.');
    return [];
  }

  const rows: Expense[] = [];
  let dropped = 0;

  for (const entry of parsed) {
    if (isExpense(entry)) {
      if (!isDemoExpense(entry.id)) {
        rows.push(entry);
      }
    } else {
      dropped += 1;
    }
  }

  if (dropped > 0) {
    console.warn(
      `[cashtrack] Skipped ${dropped} unreadable expense ${dropped === 1 ? 'row' : 'rows'}; ${rows.length} kept.`,
    );
  }

  return rows;
}
