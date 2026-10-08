import { initDatabase } from './db.ts';

export async function clearRelationalData(): Promise<void> {
  const db = await initDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM income_transactions');
    await db.runAsync('DELETE FROM money_goals');
    await db.runAsync('DELETE FROM goal_contributions');
    await db.runAsync('DELETE FROM financial_reminders');
    await db.runAsync('DELETE FROM reminder_payments');
  });
}
