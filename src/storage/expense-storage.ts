import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense } from '@/types/expense';
import { parseExpenseRowsWithDetails } from '@/storage/expense-rows';

export const STORAGE_KEY = '@cashtrack/expenses';
export const EXPENSES_BACKUP_KEY = '@cashtrack/expenses.backup';

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
