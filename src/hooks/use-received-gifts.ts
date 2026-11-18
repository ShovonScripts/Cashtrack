import { useCallback, useEffect, useSyncExternalStore } from 'react';

import {
  getGiftCategoriesStrict,
  getGiftsStrict,
  mutateGiftCategories,
  mutateGifts,
} from '@/storage/gifts-storage';
import type { GiftCategory, GiftDraft, ReceivedGift } from '@/types/gift';
import {
  addGiftCategory,
  createGiftId,
  moveGiftsToOther,
  renameGiftCategory,
  sortGifts,
  type CategoryChange,
} from '@/utils/gifts';

type Status = 'idle' | 'loading' | 'ready' | 'error';
type State = {
  status: Status;
  gifts: readonly ReceivedGift[];
  /** The person's own categories. Built-in ones come from `allGiftCategories`. */
  categories: readonly GiftCategory[];
};

/**
 * One shared copy of the gifts for the whole app. Writes update the screen
 * first, then storage; a failed write puts the screen back and rethrows so the
 * caller can say so.
 */
let state: State = { status: 'idle', gifts: [], categories: [] };
const listeners = new Set<() => void>();
let loadToken = 0;

function setState(next: State) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

/** Reads gifts and categories from storage. Call after a restore or a full reset. */
export function reloadReceivedGifts(): Promise<void> {
  const token = ++loadToken;
  setState({ ...state, status: state.status === 'ready' ? 'ready' : 'loading' });
  return Promise.all([getGiftsStrict(), getGiftCategoriesStrict()]).then(
    ([gifts, categories]) => {
      if (token === loadToken) setState({ status: 'ready', gifts: sortGifts(gifts), categories });
    },
    (error) => {
      console.error('[cashtrack] Failed to read gifts received', error);
      if (token === loadToken) setState({ status: 'error', gifts: [], categories: [] });
    },
  );
}

/** Forgets the in-memory lists (after "erase all data"); the next reader reloads them. */
export function resetReceivedGiftsState(): void {
  loadToken += 1;
  setState({ status: 'idle', gifts: [], categories: [] });
}

async function persistGifts(next: readonly ReceivedGift[], write: () => Promise<ReceivedGift[]>) {
  const previous = state;
  setState({ ...state, status: 'ready', gifts: sortGifts(next) });
  try {
    const stored = await write();
    setState({ ...state, gifts: sortGifts(stored) });
  } catch (error) {
    setState(previous);
    throw error;
  }
}

async function persistCategories(next: readonly GiftCategory[], write: () => Promise<GiftCategory[]>) {
  const previous = state;
  setState({ ...state, status: 'ready', categories: next });
  try {
    const stored = await write();
    setState({ ...state, categories: stored });
  } catch (error) {
    setState(previous);
    throw error;
  }
}

function writeGift(gift: ReceivedGift) {
  return () => mutateGifts((rows) => [gift, ...rows.filter((row) => row.id !== gift.id)]);
}

export function useReceivedGifts() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (state.status === 'idle') void reloadReceivedGifts();
  }, []);

  const add = useCallback(async (draft: GiftDraft): Promise<ReceivedGift> => {
    const now = new Date().toISOString();
    const gift: ReceivedGift = { ...draft, id: createGiftId(), createdAt: now, updatedAt: now };
    await persistGifts([gift, ...state.gifts], writeGift(gift));
    return gift;
  }, []);

  const update = useCallback(async (id: string, draft: GiftDraft): Promise<void> => {
    const current = state.gifts.find((gift) => gift.id === id);
    if (!current) throw new Error('That gift no longer exists.');
    const gift: ReceivedGift = { ...current, ...draft, id, updatedAt: new Date().toISOString() };
    await persistGifts(
      state.gifts.map((item) => (item.id === id ? gift : item)),
      () => mutateGifts((rows) => rows.map((row) => (row.id === id ? gift : row))),
    );
  }, []);

  /** Removes the gift and returns it, so it can be put back (undo). */
  const remove = useCallback(async (id: string): Promise<ReceivedGift | undefined> => {
    const removed = state.gifts.find((gift) => gift.id === id);
    if (!removed) return undefined;
    await persistGifts(
      state.gifts.filter((gift) => gift.id !== id),
      () => mutateGifts((rows) => rows.filter((row) => row.id !== id)),
    );
    return removed;
  }, []);

  /** Puts a removed gift back exactly as it was (undo). */
  const restore = useCallback(async (gift: ReceivedGift): Promise<void> => {
    if (state.gifts.some((item) => item.id === gift.id)) return;
    await persistGifts([gift, ...state.gifts], writeGift(gift));
  }, []);

  const addCategory = useCallback(async (name: string): Promise<CategoryChange> => {
    const change = addGiftCategory(state.categories, name);
    if (!change.ok) return change;
    await persistCategories(change.categories, () =>
      mutateGiftCategories((rows) => [...rows.filter((row) => row.id !== change.category.id), change.category]),
    );
    return change;
  }, []);

  const renameCategory = useCallback(async (id: string, name: string): Promise<CategoryChange> => {
    const change = renameGiftCategory(state.categories, id, name);
    if (!change.ok) return change;
    await persistCategories(change.categories, () =>
      mutateGiftCategories((rows) => rows.map((row) => (row.id === id ? change.category : row))),
    );
    return change;
  }, []);

  /**
   * Deletes a custom category. Its gifts move to Other first, so if the second
   * write fails nothing is lost: the gifts already read as Other.
   */
  const deleteCategory = useCallback(async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    if (state.gifts.some((gift) => gift.categoryId === id)) {
      await persistGifts(moveGiftsToOther(state.gifts, id, now), () =>
        mutateGifts((rows) => moveGiftsToOther(rows, id, now)),
      );
    }
    await persistCategories(
      state.categories.filter((category) => category.id !== id),
      () => mutateGiftCategories((rows) => rows.filter((row) => row.id !== id)),
    );
  }, []);

  return {
    status: snapshot.status,
    gifts: snapshot.gifts,
    categories: snapshot.categories,
    add,
    update,
    remove,
    restore,
    addCategory,
    renameCategory,
    deleteCategory,
  };
}
