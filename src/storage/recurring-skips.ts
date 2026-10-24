import AsyncStorage from '@react-native-async-storage/async-storage';

export type RecurringKind = 'expense' | 'income';

const STORAGE_KEY = '@cashtrack/recurring-skips';

type SkipMap = Record<string, string[]>;

/**
 * Remembers which generated recurring periods the user deleted so they are not
 * recreated the next time the ledger is hydrated.
 *
 * The payload is small and best-effort: if it is unreadable we start from an
 * empty map (worst case a deleted occurrence reappears) rather than blocking
 * the rest of the app.
 */
let mutationQueue: Promise<void> = Promise.resolve();

function enqueue(run: () => Promise<void>): Promise<void> {
  const next = mutationQueue.then(run, run);
  mutationQueue = next.catch(() => {});
  return next;
}

async function readSkips(): Promise<SkipMap> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw || raw.trim() === '') return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

    const result: SkipMap = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (Array.isArray(value) && value.every((entry) => typeof entry === 'string')) {
        result[key] = value;
      }
    }
    return result;
  } catch {
    return {};
  }
}

function storageKey(kind: RecurringKind, parentId: string): string {
  return `${kind}:${parentId}`;
}

/** Skip periods for one recurring kind, keyed by parent/template id. */
export async function loadRecurringSkips(
  kind: RecurringKind
): Promise<Record<string, Set<string>>> {
  const skips = await readSkips();
  const prefix = `${kind}:`;
  const result: Record<string, Set<string>> = {};

  for (const [key, periods] of Object.entries(skips)) {
    if (key.startsWith(prefix)) {
      result[key.slice(prefix.length)] = new Set(periods);
    }
  }

  return result;
}

export async function skipRecurringPeriod(
  kind: RecurringKind,
  parentId: string,
  periodKey: string
): Promise<void> {
  await enqueue(async () => {
    const current = await readSkips();
    const key = storageKey(kind, parentId);
    const periods = new Set(current[key] ?? []);
    periods.add(periodKey);
    current[key] = [...periods];
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  });
}

export type RecurringSkipsSnapshot = {
  expense: Record<string, string[]>;
  income: Record<string, string[]>;
};

/** Overwrites every skip for both recurring kinds. Used by backup restore. */
export async function replaceRecurringSkips(skips: RecurringSkipsSnapshot): Promise<void> {
  await enqueue(async () => {
    const next: SkipMap = {};
    for (const kind of ['expense', 'income'] as const) {
      for (const [parentId, periods] of Object.entries(skips[kind] ?? {})) {
        if (periods.length > 0) {
          next[storageKey(kind, parentId)] = [...new Set(periods)];
        }
      }
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  });
}

export async function clearRecurringSkips(): Promise<void> {
  await enqueue(() => AsyncStorage.removeItem(STORAGE_KEY));
}
