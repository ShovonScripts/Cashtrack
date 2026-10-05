import { initDatabase } from '@/storage/db';
import type { IncomeRecord, IncomeDraft } from '@/types/income';

export async function insertIncome(income: IncomeRecord): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO income_transactions (id, amount, date, note) VALUES (?, ?, ?, ?)',
    income.id,
    income.amount,
    income.date,
    income.note
  );
}

/** Newest first */
export async function getAllIncome(): Promise<IncomeRecord[]> {
  const db = await initDatabase();
  return db.getAllAsync<IncomeRecord>('SELECT * FROM income_transactions ORDER BY date DESC');
}

export async function getIncomeById(id: string): Promise<IncomeRecord | undefined> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<IncomeRecord>('SELECT * FROM income_transactions WHERE id = ?', id);
  return row ?? undefined;
}

export async function updateIncome(id: string, changes: IncomeDraft): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'UPDATE income_transactions SET amount = ?, note = ? WHERE id = ?',
    changes.amount,
    changes.note ?? '',
    id
  );
}

export async function deleteIncome(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM income_transactions WHERE id = ?', id);
}

export async function countIncome(): Promise<number> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM income_transactions');
  return row?.count ?? 0;
}
