import AsyncStorage from '@react-native-async-storage/async-storage';

import { initDatabase } from './db.ts';
import { DEBTS_BACKUP_KEY } from './debt-storage';
import { EXPENSES_BACKUP_KEY } from './expense-storage';
import { clearNotes } from './notes-storage';

/**
 * Clears stores that live outside the relational database: notes and the raw
 * backups written when unreadable rows were dropped. Both hold user data, so a
 * full reset must remove them too.
 */
export async function clearAuxiliaryData(): Promise<void> {
  await clearNotes();
  await AsyncStorage.multiRemove([EXPENSES_BACKUP_KEY, DEBTS_BACKUP_KEY]);
}

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
