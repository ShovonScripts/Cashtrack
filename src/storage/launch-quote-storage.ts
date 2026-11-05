import AsyncStorage from '@react-native-async-storage/async-storage';

export const LAUNCH_QUOTE_LAST_INDEX_KEY = '@cashtrack/launch-quote-last-index';

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
