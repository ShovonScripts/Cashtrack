import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types/preferences';
import { StorageParseError } from '@/storage/storage-errors';
import { sanitizePreferences } from '@/utils/preferences';

export const PREFERENCES_STORAGE_KEY = '@cashtrack/preferences';
export const PREFERENCES_CORRUPT_BACKUP_KEY = '@cashtrack/preferences.corrupt-backup';

export { StorageParseError };

export async function loadPreferences(): Promise<UserPreferences> {
  const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (!raw) return DEFAULT_PREFERENCES;
  try {
    return sanitizePreferences(JSON.parse(raw) as unknown);
  } catch (error) {
    throw new StorageParseError(`Failed to parse preferences: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function savePreferences(preferences: UserPreferences): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

/**
 * Preserves unreadable preferences before defaults overwrite them. Only call
 * after a parse failure (not an IO failure).
 */
export async function backupUnreadablePreferences(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (raw === null) return false;
    const existing = await AsyncStorage.getItem(PREFERENCES_CORRUPT_BACKUP_KEY);
    if (existing === null) {
      await AsyncStorage.setItem(PREFERENCES_CORRUPT_BACKUP_KEY, raw);
    }
    return true;
  } catch (error) {
    console.error('[cashtrack] Failed to back up unreadable preferences', error);
    return false;
  }
}
