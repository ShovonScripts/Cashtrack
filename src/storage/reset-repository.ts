import AsyncStorage from '@react-native-async-storage/async-storage';

import { initDatabase } from './db.ts';

const APP_STORAGE_PREFIXES = ['@cashtrack', '@spendly'];

/**
 * Removes every key this app owns, including quick tools, cached exchange
 * rates, clock choices, corrupt-data backups and the App Lock flag. AsyncStorage
 * is app-scoped, but the explicit prefixes avoid touching keys owned by other
 * libraries.
 */
export async function clearAuxiliaryData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const removable = keys.filter((key) => APP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)));
  if (removable.length > 0) {
    await AsyncStorage.multiRemove(removable);
  }
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
