import assert from 'node:assert/strict';
import test from 'node:test';
import { SaveQueue, shouldSave } from '../src/utils/save-queue.ts';

test('shouldSave returns false before load or on load failure', () => {
  assert.equal(shouldSave({ hasLoaded: false, loadFailed: false, currentJson: 'a', lastSavedJson: 'b' }), false);
  assert.equal(shouldSave({ hasLoaded: true, loadFailed: true, currentJson: 'a', lastSavedJson: 'b' }), false);
});

test('shouldSave returns false when data is unchanged', () => {
  assert.equal(shouldSave({ hasLoaded: true, loadFailed: false, currentJson: 'same', lastSavedJson: 'same' }), false);
});

test('shouldSave returns true when loaded, not failed, and data changed', () => {
  assert.equal(shouldSave({ hasLoaded: true, loadFailed: false, currentJson: 'new', lastSavedJson: 'old' }), true);
});

test('SaveQueue executes saves serially in order and returns boolean success status', async () => {
  const queue = new SaveQueue();
  const order: number[] = [];

  const p1 = queue.enqueue(async () => {
    throw new Error('fail');
  });

  const p2 = queue.enqueue(async () => {
    order.push(2);
  });

  const res1 = await p1;
  const res2 = await p2;

  assert.equal(res1, false);
  assert.equal(res2, true);
  assert.deepEqual(order, [2]);
});

test('SaveQueue serial execution order with async delay', async () => {
  const queue = new SaveQueue();
  const order: number[] = [];

  void queue.enqueue(async () => {
    await new Promise((r) => setTimeout(r, 30));
    order.push(1);
  });

  await queue.enqueue(async () => {
    order.push(2);
  });

  assert.deepEqual(order, [1, 2]);
});
