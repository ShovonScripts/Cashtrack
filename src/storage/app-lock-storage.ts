import AsyncStorage from '@react-native-async-storage/async-storage';

import { parseAppLockFlag } from '@/utils/app-lock';

/**
 * App Lock lives in its own key so a corrupt or unreadable preferences blob
 * cannot silently disable a security control. Preferences still mirror the
 * value for the rest of the UI, but this key is authoritative at startup.
 */
export const APP_LOCK_STORAGE_KEY = '@cashtrack/app-lock-enabled';

export async function loadAppLockFlag(): Promise<boolean | null> {
  const raw = await AsyncStorage.getItem(APP_LOCK_STORAGE_KEY);
  return parseAppLockFlag(raw);
}

export async function saveAppLockFlag(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(APP_LOCK_STORAGE_KEY, enabled ? 'true' : 'false');
}
