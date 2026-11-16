import AsyncStorage from '@react-native-async-storage/async-storage';

import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';
import type { SavedQuote } from '@/types/saved-quote';

export const SAVED_QUOTES_STORAGE_KEY = '@cashtrack/saved-quotes';

const savedQuoteRows = objectRows<SavedQuote>('saved quote');

/**
 * Strict read: a corrupt payload throws instead of looking like an empty list,
 * so neither a backup nor a write can silently drop every saved quote.
 */
export async function getSavedQuotesStrict(): Promise<SavedQuote[]> {
  return readJsonArray(AsyncStorage, SAVED_QUOTES_STORAGE_KEY, 'saved quotes', savedQuoteRows);
}

/** Adds a quote (newest first). Saving one that is already saved keeps the original. */
export async function addSavedQuote(entry: SavedQuote): Promise<SavedQuote[]> {
  return mutateJsonArray(AsyncStorage, SAVED_QUOTES_STORAGE_KEY, 'saved quotes', savedQuoteRows, (rows) =>
    rows.some((row) => row.id === entry.id) ? rows : [entry, ...rows],
  );
}

export async function removeSavedQuote(id: string): Promise<SavedQuote[]> {
  return mutateJsonArray(AsyncStorage, SAVED_QUOTES_STORAGE_KEY, 'saved quotes', savedQuoteRows, (rows) =>
    rows.filter((row) => row.id !== id),
  );
}

/** Overwrites the collection. Used when restoring a full backup. */
export async function replaceSavedQuotes(rows: SavedQuote[]): Promise<void> {
  await AsyncStorage.setItem(SAVED_QUOTES_STORAGE_KEY, JSON.stringify(rows));
}
