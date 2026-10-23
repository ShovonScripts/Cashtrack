import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DebtRecord } from '@/types/debt';
import { parseDebtRowsWithDetails } from '@/storage/debt-rows';

export const DEBT_STORAGE_KEY = '@cashtrack/debts';
export const DEBTS_BACKUP_KEY = '@cashtrack/debts.backup';
export const DEBTS_CORRUPT_BACKUP_KEY = '@cashtrack/debts.corrupt-backup';

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

/**
 * Preserves an unreadable debts payload before the app starts writing fresh
 * data over it. Only call this after a parse failure (not an IO failure).
 */
export async function backupUnreadableDebts(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(DEBT_STORAGE_KEY);
    if (raw === null) return false;
    const existing = await AsyncStorage.getItem(DEBTS_CORRUPT_BACKUP_KEY);
    if (existing === null) {
      await AsyncStorage.setItem(DEBTS_CORRUPT_BACKUP_KEY, raw);
    }
    return true;
  } catch (error) {
    console.error('[cashtrack] Failed to back up unreadable debts', error);
    return false;
  }
}
