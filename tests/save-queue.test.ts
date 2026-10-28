import assert from 'node:assert/strict';
import test from 'node:test';
import { runWithSaveQueueLock, SaveQueue, shouldSave } from '../src/utils/save-queue.ts';

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

test('SaveQueue distinguishes saved, failed and intentionally skipped writes', async () => {
  const queue = new SaveQueue();

  assert.equal(
    await queue.enqueueDetailed(async () => {
      throw new Error('fail');
    }),
    'failed',
  );
  assert.equal(await queue.enqueueDetailed(async () => {}), 'saved');

  await runWithSaveQueueLock(async () => {
    assert.equal(await queue.enqueueDetailed(async () => {}), 'skipped');
  });

  assert.equal(await queue.enqueueDetailed(async () => {}), 'saved');
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

test('SaveQueue lock waits for in-flight saves and skips stale queued saves', async () => {
  const queue = new SaveQueue();
  const order: string[] = [];
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markStarted = () => {};
  const started = new Promise<void>((resolve) => {
    markStarted = resolve;
  });

  const inFlight = queue.enqueue(async () => {
    order.push('start');
    markStarted();
    await gate;
    order.push('finish');
  });

  await started;

  let pendingRan = false;
  const pending = queue.enqueue(async () => {
    pendingRan = true;
    order.push('pending');
  });

  const restoring = runWithSaveQueueLock(async () => {
    order.push('restore');
  });

  release();
  await inFlight;

  assert.equal(await pending, false);
  await restoring;
  assert.deepEqual(order, ['start', 'finish', 'restore']);
  assert.equal(pendingRan, false);
});

test('SaveQueue lock skips saves queued while locked and resumes afterwards', async () => {
  const queue = new SaveQueue();
  const order: string[] = [];
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markLocked = () => {};
  const locked = new Promise<void>((resolve) => {
    markLocked = resolve;
  });

  const restoring = runWithSaveQueueLock(async () => {
    markLocked();
    await gate;
    order.push('restore');
  });

  await locked;

  const during = await queue.enqueue(async () => {
    order.push('during');
  });

  release();
  await restoring;

  const after = await queue.enqueue(async () => {
    order.push('after');
  });

  assert.equal(during, false);
  assert.equal(after, true);
  assert.deepEqual(order, ['restore', 'after']);
});
