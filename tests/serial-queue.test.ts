import assert from 'node:assert/strict';
import test from 'node:test';

import { SerialQueue } from '../src/utils/serial-queue.ts';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test('SerialQueue runs tasks in submission order even when earlier tasks are slow', async () => {
  const queue = new SerialQueue();
  const order: string[] = [];

  const first = queue.run(async () => {
    await delay(20);
    order.push('first');
    return 'first';
  });
  const second = queue.run(async () => {
    order.push('second');
    return 'second';
  });

  assert.deepEqual(await Promise.all([first, second]), ['first', 'second']);
  assert.deepEqual(order, ['first', 'second']);
});

test('SerialQueue keeps running after a failed task and only rejects that caller', async () => {
  const queue = new SerialQueue();
  const failure = new Error('write failed');

  const failed = queue.run(async () => {
    throw failure;
  });
  const rejected = assert.rejects(failed, (error) => error === failure);

  const next = queue.run(async () => 'ok');

  await rejected;
  assert.equal(await next, 'ok');
});

test('SerialQueue executes every concurrent submission exactly once', async () => {
  const queue = new SerialQueue();
  const order: number[] = [];

  const tasks = Array.from({ length: 8 }, (_, index) =>
    queue.run(async () => {
      await delay(index % 3);
      order.push(index);
    }),
  );

  await Promise.all(tasks);
  assert.deepEqual(order, [0, 1, 2, 3, 4, 5, 6, 7]);
});
