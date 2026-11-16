import { useCallback, useEffect, useSyncExternalStore } from 'react';

import type { FinancialQuote } from '@/constants/quotes';
import { addSavedQuote, getSavedQuotesStrict, removeSavedQuote } from '@/storage/saved-quotes-storage';
import type { SavedQuote } from '@/types/saved-quote';

type Status = 'idle' | 'loading' | 'ready' | 'error';
type State = { status: Status; items: readonly SavedQuote[] };

/**
 * One shared copy of the saved quotes for the whole app, so a heart tapped on
 * the opening screen shows as saved on the Home cover and the Quotes page at
 * once. Writes update the screen first, then storage; a failed write rolls
 * the screen back and rethrows so the caller can say so.
 */
let state: State = { status: 'idle', items: [] };
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

/** Reads saved quotes from storage. Call after a restore or a full reset. */
export function reloadSavedQuotes(): Promise<void> {
  const token = ++loadToken;
  setState({ ...state, status: state.status === 'ready' ? 'ready' : 'loading' });
  return getSavedQuotesStrict().then(
    (items) => {
      if (token === loadToken) setState({ status: 'ready', items });
    },
    (error) => {
      console.error('[cashtrack] Failed to read saved quotes', error);
      if (token === loadToken) setState({ status: 'error', items: [] });
    },
  );
}

/** Forgets the in-memory list (after "erase all data"); the next reader reloads it. */
export function resetSavedQuotesState(): void {
  loadToken += 1;
  setState({ status: 'idle', items: [] });
}

async function persist(next: readonly SavedQuote[], write: () => Promise<SavedQuote[]>) {
  const previous = state;
  setState({ status: 'ready', items: next });
  try {
    const stored = await write();
    setState({ status: 'ready', items: stored });
  } catch (error) {
    setState(previous);
    throw error;
  }
}

export function useSavedQuotes() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    if (state.status === 'idle') void reloadSavedQuotes();
  }, []);

  const isSaved = useCallback(
    (id: string) => snapshot.items.some((item) => item.id === id),
    [snapshot.items],
  );

  /** Saves the quote, keeping a copy of its text. */
  const save = useCallback(async (quote: Pick<FinancialQuote, 'id' | 'quote' | 'author'>) => {
    if (state.items.some((item) => item.id === quote.id)) return;
    const entry: SavedQuote = {
      id: quote.id,
      quote: quote.quote,
      author: quote.author,
      savedAt: new Date().toISOString(),
    };
    await persist([entry, ...state.items], () => addSavedQuote(entry));
  }, []);

  /** Removes the quote and returns the removed entry, so it can be put back (undo). */
  const remove = useCallback(async (id: string): Promise<SavedQuote | undefined> => {
    const removed = state.items.find((item) => item.id === id);
    if (!removed) return undefined;
    await persist(
      state.items.filter((item) => item.id !== id),
      () => removeSavedQuote(id),
    );
    return removed;
  }, []);

  /** Puts a removed entry back with its original saved date (undo). */
  const restore = useCallback(async (entry: SavedQuote) => {
    if (state.items.some((item) => item.id === entry.id)) return;
    const next = [...state.items, entry].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    await persist(next, async () => {
      const stored = await addSavedQuote(entry);
      return [...stored].sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    });
  }, []);

  /** Saves or un-saves; resolves to the new saved state. */
  const toggle = useCallback(
    async (quote: Pick<FinancialQuote, 'id' | 'quote' | 'author'>): Promise<boolean> => {
      if (state.items.some((item) => item.id === quote.id)) {
        await remove(quote.id);
        return false;
      }
      await save(quote);
      return true;
    },
    [remove, save],
  );

  return {
    items: snapshot.items,
    status: snapshot.status,
    isSaved,
    save,
    remove,
    restore,
    toggle,
  };
}
