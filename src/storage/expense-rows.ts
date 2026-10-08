import type { Expense } from '@/types/expense';
import { StorageParseError } from './storage-errors.ts';

export const DEMO_EXPENSE_ID_PREFIX = 'demo-expense-';
export { StorageParseError };

export function isDemoExpense(id: string): boolean {
  return id.startsWith(DEMO_EXPENSE_ID_PREFIX);
}

export function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Expense>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    candidate.amount > 0 &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    typeof candidate.note === 'string' &&
    typeof candidate.category === 'string' &&
    candidate.category.trim().length > 0
  );
}

export function parseExpenseRowsWithDetails(raw: string): { rows: Expense[]; dropped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new StorageParseError(`Unparseable expenses JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new StorageParseError('Stored expenses payload is not a list');
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

  return { rows, dropped };
}

export function parseExpenseRows(raw: string): Expense[] {
  return parseExpenseRowsWithDetails(raw).rows;
}
