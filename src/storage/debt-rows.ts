import type { DebtRecord } from '@/types/debt';
import { StorageParseError } from './storage-errors.ts';

export { StorageParseError };

export function isDebtRecord(value: unknown): value is DebtRecord {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<DebtRecord>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.length > 0 &&
    typeof candidate.personName === 'string' &&
    candidate.personName.trim().length > 0 &&
    typeof candidate.amount === 'number' &&
    Number.isFinite(candidate.amount) &&
    (candidate.type === 'lent' || candidate.type === 'borrowed') &&
    typeof candidate.date === 'string' &&
    !Number.isNaN(new Date(candidate.date).getTime()) &&
    (candidate.status === 'active' || candidate.status === 'settled') &&
    typeof candidate.note === 'string'
  );
}

export function parseDebtRowsWithDetails(raw: string): { rows: DebtRecord[]; dropped: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new StorageParseError(`Unparseable debts JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new StorageParseError('Stored debts payload is not a list');
  }

  const rows: DebtRecord[] = [];
  let dropped = 0;

  for (const entry of parsed) {
    if (isDebtRecord(entry)) {
      rows.push(entry);
    } else {
      dropped += 1;
    }
  }

  return { rows, dropped };
}

export function parseDebtRows(raw: string): DebtRecord[] {
  return parseDebtRowsWithDetails(raw).rows;
}
