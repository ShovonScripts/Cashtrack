import type { DebtRecord } from '@/types/debt';

export function isDebtRecord(value: unknown): value is DebtRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
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

/**
 * Parses the stored debt ledger row by row, keeping every usable record and reporting
 * the rest. Mirrors `parseExpenseRows`: a single corrupt row must not discard the whole
 * ledger, and an unreadable payload must not be mistaken for a first launch.
 */
export function parseDebtRows(raw: string): DebtRecord[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error(
      '[cashtrack] The saved debts could not be parsed as JSON. Starting from an empty ledger; the stored value is left untouched until the next save.',
      error,
    );
    return [];
  }

  if (!Array.isArray(parsed)) {
    console.error('[cashtrack] The saved debts are not a list. Starting from an empty ledger.');
    return [];
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

  if (dropped > 0) {
    console.warn(
      `[cashtrack] Skipped ${dropped} unreadable debt ${dropped === 1 ? 'row' : 'rows'}; ${rows.length} kept.`,
    );
  }

  return rows;
}
