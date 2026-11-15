import { Platform } from 'react-native';

/**
 * Android-only native alarm (modules/alarm-popup): rings even when the app is
 * closed and pops a full-screen "Time's up!" screen up, with Stop / Snooze.
 * Null on iOS, web, Expo Go, and builds made before the module was added;
 * callers then fall back to expo-notifications.
 */
export type AlarmPopupAction = { id: string; action: 'dismiss' | 'snooze'; at: number; endAt: number | null };

type AlarmPopupNative = {
  schedule(id: string, label: string, fireAt: number): void;
  cancel(id: string): void;
  getRingingIds(): string[];
  getScheduledIds(): string[];
  takeActions(): AlarmPopupAction[];
  ensureAlarmChannel(id: string, name: string, description: string): 'default' | 'custom' | null;
  canScheduleExactAlarms(): boolean;
  canUseFullScreenIntent(): boolean;
  openFullScreenIntentSettings(): void;
  addListener(event: 'onAlarmChange', listener: () => void): { remove(): void };
};

let native: AlarmPopupNative | null = null;
if (Platform.OS === 'android') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { requireOptionalNativeModule } = require('expo');
    native = requireOptionalNativeModule('AlarmPopup');
  } catch {
    native = null;
  }
}

export const alarmPopup = native;

/** Runs a native call, swallowing errors so a native hiccup never crashes the UI. */
export function safely<T>(call: (n: AlarmPopupNative) => T, fallback: T): T {
  if (!native) return fallback;
  try {
    return call(native);
  } catch (error) {
    console.error('[cashtrack] Alarm pop-up call failed', error);
    return fallback;
  }
}
