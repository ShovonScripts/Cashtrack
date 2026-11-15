import AsyncStorage from '@react-native-async-storage/async-storage';

import { COUNTDOWN_MODES } from '@/utils/year-progress';

export const LAUNCH_QUOTE_LAST_INDEX_KEY = '@cashtrack/launch-quote-last-index';
export const LAUNCH_COUNTDOWN_MODE_KEY = '@cashtrack/launch-countdown-mode';

/** Index of the quote shown on the previous launch, or null if none was saved. */
export async function readLastLaunchQuoteIndex(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAUNCH_QUOTE_LAST_INDEX_KEY);
    if (raw === null) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveLastLaunchQuoteIndex(index: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAUNCH_QUOTE_LAST_INDEX_KEY, String(index));
  } catch {
    // A missed save only means the next launch might repeat a quote.
  }
}

/** Countdown unit shown on the previous launch (0 days, 1 hours, 2 minutes), or null. */
export async function readLastLaunchCountdownMode(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(LAUNCH_COUNTDOWN_MODE_KEY);
    if (raw === null) return null;
    const parsed = Number.parseInt(raw, 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed < COUNTDOWN_MODES ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveLastLaunchCountdownMode(mode: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAUNCH_COUNTDOWN_MODE_KEY, String(mode));
  } catch {
    // A missed save only means the next launch might repeat a unit.
  }
}
