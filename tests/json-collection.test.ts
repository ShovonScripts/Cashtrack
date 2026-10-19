import assert from 'node:assert/strict';
import test from 'node:test';

import {
  mutateJsonArray,
  objectRows,
  parseJsonArray,
  readJsonArray,
  writeJsonArray,
  type KeyValueStorage,
} from '../src/storage/json-collection.ts';
import { mapGoalRow } from '../src/storage/goal-rows.ts';
import { StorageParseError } from '../src/storage/storage-errors.ts';

class FakeStorage implements KeyValueStorage {
  public readonly store = new Map<string, string>();
  public readonly writes: Array<{ key: string; value: string }> = [];

  constructor(seed: Record<string, string> = {}) {
    for (const [key, value] of Object.entries(seed)) {
      this.store.set(key, value);
    }
  }

  async getItem(key: string): Promise<string | null> {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.writes.push({ key, value });
    this.store.set(key, value);
  }
}

const GOALS_KEY = '@cashtrack/goals';
const incomeRows = objectRows<{ id: string; amount: number }>('income');

test('an absent key reads as an empty list', async () => {
  const storage = new FakeStorage();
  assert.deepEqual(await readJsonArray(storage, GOALS_KEY, 'goals', mapGoalRow), []);
});

test('a blank stored value reads as an empty list', async () => {
  const storage = new FakeStorage({ [GOALS_KEY]: '   ' });
  assert.deepEqual(await readJsonArray(storage, GOALS_KEY, 'goals', mapGoalRow), []);
});

test('a valid empty store is readable and remains writable', async () => {
  const storage = new FakeStorage({ '@cashtrack/income': '[]' });
  const list = await readJsonArray(storage, '@cashtrack/income', 'income', incomeRows);
  assert.deepEqual(list, []);

  await mutateJsonArray(storage, '@cashtrack/income', 'income', incomeRows, (rows) => [
    { id: 'a', amount: 5 },
    ...rows,
  ]);
  assert.deepEqual(JSON.parse(storage.store.get('@cashtrack/income') as string), [{ id: 'a', amount: 5 }]);
});

test('malformed JSON throws StorageParseError instead of returning an empty list', async () => {
  const storage = new FakeStorage({ [GOALS_KEY]: '{not json' });
  await assert.rejects(
    () => readJsonArray(storage, GOALS_KEY, 'goals', mapGoalRow),
    StorageParseError
  );
});

test('a payload that is not a list throws StorageParseError', async () => {
  const storage = new FakeStorage({ [GOALS_KEY]: '{"goals":[]}' });
  await assert.rejects(
    () => readJsonArray(storage, GOALS_KEY, 'goals', mapGoalRow),
    StorageParseError
  );
});

test('an entry that is not an object throws StorageParseError', async () => {
  const storage = new FakeStorage({ '@cashtrack/income': '[1,2,3]' });
  await assert.rejects(
    () => readJsonArray(storage, '@cashtrack/income', 'income', incomeRows),
    StorageParseError
  );
});

test('a failing row mapper propagates rather than collapsing to an empty list', async () => {
  const storage = new FakeStorage({ '@cashtrack/goals': '[{"id":"g1"}]' });
  await assert.rejects(
    () =>
      readJsonArray(storage, '@cashtrack/goals', 'goals', () => {
        throw new StorageParseError('mapping failed');
      }),
    StorageParseError
  );
});

test('mutating corrupt data throws and never overwrites the original value', async () => {
  const storage = new FakeStorage({ '@cashtrack/income': '{corrupt' });
  await assert.rejects(
    () => mutateJsonArray(storage, '@cashtrack/income', 'income', incomeRows, (rows) => [...rows]),
    StorageParseError
  );
  assert.equal(storage.store.get('@cashtrack/income'), '{corrupt');
  assert.equal(storage.writes.length, 0);
});

test('mutating valid data preserves existing records', async () => {
  const storage = new FakeStorage({
    '@cashtrack/income': JSON.stringify([{ id: 'a', amount: 5 }]),
  });
  await mutateJsonArray(storage, '@cashtrack/income', 'income', incomeRows, (rows) => [
    { id: 'b', amount: 9 },
    ...rows,
  ]);
  assert.deepEqual(JSON.parse(storage.store.get('@cashtrack/income') as string), [
    { id: 'b', amount: 9 },
    { id: 'a', amount: 5 },
  ]);
});

test('writeJsonArray round-trips through readJsonArray', async () => {
  const storage = new FakeStorage();
  await writeJsonArray(storage, GOALS_KEY, []);
  assert.deepEqual(await readJsonArray(storage, GOALS_KEY, 'goals', mapGoalRow), []);
});

test('parseJsonArray treats null and blank as empty and throws on garbage', () => {
  const identity = (row: unknown) => row;
  assert.deepEqual(parseJsonArray(null, 'x', identity), []);
  assert.deepEqual(parseJsonArray('', 'x', identity), []);
  assert.throws(() => parseJsonArray('<html>', 'x', identity), StorageParseError);
});

test('mapGoalRow fills legacy defaults and keeps stored values', () => {
  const mapped = mapGoalRow({ id: 'g1', title: 'Trip', targetAmount: 100 });
  assert.equal(mapped.potType, 'general');
  assert.equal(mapped.allocationType, 'manual');
  assert.equal(mapped.allocationPercent, null);
  assert.equal(mapped.icon, 'piggy-bank');

  const explicit = mapGoalRow({ id: 'g2', potType: 'dream', icon: '🎯' });
  assert.equal(explicit.potType, 'dream');
  assert.equal(explicit.icon, '🎯');
});

test('mapGoalRow rejects non-object entries', () => {
  assert.throws(() => mapGoalRow('nope'), StorageParseError);
  assert.throws(() => mapGoalRow(['nope']), StorageParseError);
  assert.throws(() => mapGoalRow(null), StorageParseError);
});
