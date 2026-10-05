import { initDatabase } from '@/storage/db';
import type { IncomeRecord, IncomeDraft } from '@/types/income';
import type { RecurringFrequency } from '@/types/expense';

interface IncomeRow {
  id: string;
  amount: number;
  date: string;
  note: string;
  is_recurring?: number;
  recurring_frequency?: string | null;
  recurring_end_date?: string | null;
  recurring_parent_id?: string | null;
}

function mapIncomeRow(row: IncomeRow): IncomeRecord {
  return {
    id: row.id,
    amount: row.amount,
    date: row.date,
    note: row.note,
    isRecurring: Boolean(row.is_recurring),
    recurringFrequency: (row.recurring_frequency as RecurringFrequency) ?? undefined,
    recurringEndDate: row.recurring_end_date ?? null,
    recurringParentId: row.recurring_parent_id ?? undefined,
  };
}

export async function insertIncome(income: IncomeRecord): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO income_transactions (id, amount, date, note, is_recurring, recurring_frequency, recurring_end_date, recurring_parent_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    income.id,
    income.amount,
    income.date,
    income.note,
    income.isRecurring ? 1 : 0,
    income.recurringFrequency ?? null,
    income.recurringEndDate ?? null,
    income.recurringParentId ?? null
  );
}

/** Newest first */
export async function getAllIncome(): Promise<IncomeRecord[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<IncomeRow>('SELECT * FROM income_transactions ORDER BY date DESC');
  return rows.map(mapIncomeRow);
}

export async function getIncomeById(id: string): Promise<IncomeRecord | undefined> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<IncomeRow>('SELECT * FROM income_transactions WHERE id = ?', id);
  return row ? mapIncomeRow(row) : undefined;
}

export async function updateIncome(id: string, changes: IncomeDraft): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'UPDATE income_transactions SET amount = ?, note = ?, is_recurring = ?, recurring_frequency = ?, recurring_end_date = ? WHERE id = ?',
    changes.amount,
    changes.note ?? '',
    changes.isRecurring ? 1 : 0,
    changes.recurringFrequency ?? null,
    changes.recurringEndDate ?? null,
    id
  );
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM income_transactions WHERE id = ? OR recurring_parent_id = ?', id, id);
}

export async function countIncome(): Promise<number> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM income_transactions');
  return row?.count ?? 0;
}
