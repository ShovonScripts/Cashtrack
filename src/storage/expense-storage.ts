import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense } from '@/types/expense';
import { parseExpenseRowsWithDetails } from '@/storage/expense-rows';

export const STORAGE_KEY = '@cashtrack/expenses';
export const EXPENSES_BACKUP_KEY = '@cashtrack/expenses.backup';
export const EXPENSES_CORRUPT_BACKUP_KEY = '@cashtrack/expenses.corrupt-backup';

export async function loadExpenses(): Promise<Expense[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const { rows, dropped } = parseExpenseRowsWithDetails(raw);
  if (dropped > 0) {
    const backup = await AsyncStorage.getItem(EXPENSES_BACKUP_KEY);
    if (backup === null) {
      await AsyncStorage.setItem(EXPENSES_BACKUP_KEY, raw);
    }
    console.warn(`[cashtrack] Skipped ${dropped} unreadable expense rows and wrote backup to ${EXPENSES_BACKUP_KEY}`);
  }
  return rows;
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

/**
 * Preserves an unreadable expenses payload before the app starts writing fresh
 * data over it. Only call this after a parse failure (not an IO failure), so a
 * transient read error can never cause valid data to be replaced.
 */
export async function backupUnreadableExpenses(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === null) return false;
    const existing = await AsyncStorage.getItem(EXPENSES_CORRUPT_BACKUP_KEY);
    if (existing === null) {
      await AsyncStorage.setItem(EXPENSES_CORRUPT_BACKUP_KEY, raw);
    }
    return true;
  } catch (error) {
    console.error('[cashtrack] Failed to back up unreadable expenses', error);
    return false;
  }
}
