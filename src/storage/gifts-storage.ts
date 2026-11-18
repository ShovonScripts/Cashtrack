import AsyncStorage from '@react-native-async-storage/async-storage';

import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';
import type { GiftCategory, ReceivedGift } from '@/types/gift';

export const GIFTS_STORAGE_KEY = '@cashtrack/gifts-received';
export const GIFT_CATEGORIES_STORAGE_KEY = '@cashtrack/gift-categories';

const giftRows = objectRows<ReceivedGift>('gift');
const categoryRows = objectRows<GiftCategory>('gift category');

/**
 * Strict reads: a corrupt payload throws instead of looking like an empty list,
 * so neither a backup nor a write can silently drop every gift.
 */
export function getGiftsStrict(): Promise<ReceivedGift[]> {
  return readJsonArray(AsyncStorage, GIFTS_STORAGE_KEY, 'gifts', giftRows);
}

/** Only the person's own categories; built-in ones live in code. */
export function getGiftCategoriesStrict(): Promise<GiftCategory[]> {
  return readJsonArray(AsyncStorage, GIFT_CATEGORIES_STORAGE_KEY, 'gift categories', categoryRows);
}

export function mutateGifts(mutate: (rows: ReceivedGift[]) => ReceivedGift[]): Promise<ReceivedGift[]> {
  return mutateJsonArray(AsyncStorage, GIFTS_STORAGE_KEY, 'gifts', giftRows, mutate);
}

export function mutateGiftCategories(mutate: (rows: GiftCategory[]) => GiftCategory[]): Promise<GiftCategory[]> {
  return mutateJsonArray(AsyncStorage, GIFT_CATEGORIES_STORAGE_KEY, 'gift categories', categoryRows, mutate);
}

/** Overwrites the collection. Used when restoring a full backup. */
export async function replaceGifts(rows: ReceivedGift[]): Promise<void> {
  await AsyncStorage.setItem(GIFTS_STORAGE_KEY, JSON.stringify(rows));
}

/** Overwrites the collection. Used when restoring a full backup. */
export async function replaceGiftCategories(rows: GiftCategory[]): Promise<void> {
  await AsyncStorage.setItem(GIFT_CATEGORIES_STORAGE_KEY, JSON.stringify(rows));
}
