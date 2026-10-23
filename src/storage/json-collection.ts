import { StorageParseError } from './storage-errors.ts';

/**
 * Safe JSON-array persistence helpers for the web repositories.
 *
 * The key rule: a read that cannot be trusted must never look like an empty
 * store. `readJsonArray` only returns `[]` for a genuinely absent or blank key,
 * and throws for malformed JSON, non-list payloads, or a failing row mapper. If a
 * writer reads through these helpers, a corrupt payload aborts the write before
 * anything is persisted, so the original data is preserved exactly.
 *
 * This module has no native imports so the behaviour can be unit-tested with an
 * in-memory storage stub.
 */

export interface KeyValueStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * Parses a raw stored value into a mapped array.
 * - `null` or blank  -> `[]` (valid, genuinely empty store)
 * - valid JSON array -> mapped rows
 * - anything else    -> throws `StorageParseError`
 */
export function parseJsonArray<T>(
  raw: string | null,
  label: string,
  mapRow: (row: unknown, index: number) => T
): T[] {
  if (raw === null || raw.trim() === '') {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new StorageParseError(
      `Unparseable ${label} JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!Array.isArray(parsed)) {
    throw new StorageParseError(`Stored ${label} payload is not a list`);
  }

  return parsed.map((row, index) => mapRow(row, index));
}

/** Reads and maps a JSON array from storage. Throws rather than returning `[]` on corrupt data. */
export async function readJsonArray<T>(
  storage: KeyValueStorage,
  key: string,
  label: string,
  mapRow: (row: unknown, index: number) => T
): Promise<T[]> {
  const raw = await storage.getItem(key);
  return parseJsonArray(raw, label, mapRow);
}

export async function writeJsonArray<T>(
  storage: KeyValueStorage,
  key: string,
  rows: readonly T[]
): Promise<void> {
  await storage.setItem(key, JSON.stringify(rows));
}

const keyQueues = new Map<string, Promise<unknown>>();

/**
 * Read-modify-write for a single key. Because the read throws on corrupt data,
 * a failed read can never be followed by a destructive write.
 *
 * Writes to the same key are serialized so two concurrent mutations cannot read
 * the same snapshot and clobber each other (which could lose a record or
 * resurrect a deleted one).
 */
export async function mutateJsonArray<T>(
  storage: KeyValueStorage,
  key: string,
  label: string,
  mapRow: (row: unknown, index: number) => T,
  mutate: (rows: T[]) => T[]
): Promise<T[]> {
  const previous = keyQueues.get(key) ?? Promise.resolve();
  const run = previous.catch(() => undefined).then(async () => {
    const current = await readJsonArray(storage, key, label, mapRow);
    const next = mutate(current);
    await writeJsonArray(storage, key, next);
    return next;
  });

  keyQueues.set(key, run);
  try {
    return await run;
  } finally {
    if (keyQueues.get(key) === run) {
      keyQueues.delete(key);
    }
  }
}

/**
 * Mapper that validates each stored entry is a plain object and returns it
 * unchanged. Use for stores whose records are already fully shaped in storage.
 */
export function objectRows<T>(label: string) {
  return (row: unknown, index: number): T => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      throw new StorageParseError(`Stored ${label} entry #${index} is not an object`);
    }
    return row as T;
  };
}
