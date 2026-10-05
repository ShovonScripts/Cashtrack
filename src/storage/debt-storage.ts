import AsyncStorage from '@react-native-async-storage/async-storage';

import type { DebtRecord } from '@/types/debt';
import { parseDebtRows } from '@/storage/debt-rows';

export const DEBT_STORAGE_KEY = '@cashtrack/debts';

/**
 * Reads the saved debts. Returns `null` only when the key is genuinely absent; an
 * unreadable payload resolves to an empty list rather than looking like a first launch.
 */
export async function loadDebts(): Promise<DebtRecord[] | null> {
  const raw = await AsyncStorage.getItem(DEBT_STORAGE_KEY);

  if (raw === null) {
    return null;
  }

  return parseDebtRows(raw);
}

export async function saveDebts(debts: DebtRecord[]): Promise<void> {
  await AsyncStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(debts));
}
