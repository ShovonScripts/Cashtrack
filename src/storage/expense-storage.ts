import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Expense } from '@/types/expense';
import { parseExpenseRows } from '@/storage/expense-rows';

export const STORAGE_KEY = '@cashtrack/expenses';

/**
 * Reads the saved expenses.
 *
 * Returns `null` only when the key is genuinely absent, which is the one case where the
 * caller may fall back to the first-launch demo data. A key that exists but cannot be
 * parsed resolves to an empty list instead, so a partial read never turns into a
 * destructive re-seed.
 */
export async function loadExpenses(): Promise<Expense[] | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return null;
  }

  return parseExpenseRows(raw);
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}
