import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DebtRecord } from '@/types/debt';
import { parseDebtRowsWithDetails } from '@/storage/debt-rows';

export const DEBT_STORAGE_KEY = '@cashtrack/debts';
export const DEBTS_BACKUP_KEY = '@cashtrack/debts.backup';

export async function loadDebts(): Promise<DebtRecord[] | null> {
  const raw = await AsyncStorage.getItem(DEBT_STORAGE_KEY);
  if (raw === null) {
    return null;
  }
  const { rows, dropped } = parseDebtRowsWithDetails(raw);
  if (dropped > 0) {
    const backup = await AsyncStorage.getItem(DEBTS_BACKUP_KEY);
    if (backup === null) {
      await AsyncStorage.setItem(DEBTS_BACKUP_KEY, raw);
    }
    console.warn(`[cashtrack] Skipped ${dropped} unreadable debt rows and wrote backup to ${DEBTS_BACKUP_KEY}`);
  }
  return rows;
}

export async function saveDebts(debts: DebtRecord[]): Promise<void> {
  await AsyncStorage.setItem(DEBT_STORAGE_KEY, JSON.stringify(debts));
}
