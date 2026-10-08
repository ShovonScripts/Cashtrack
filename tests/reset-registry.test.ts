import assert from 'node:assert/strict';
import test from 'node:test';
import { ResetRegistry } from '../src/utils/reset-registry.ts';

test('ResetRegistry runs handlers in registration order', async () => {
  const registry = new ResetRegistry();
  const order: number[] = [];

  registry.register(async () => {
    order.push(1);
  });
  registry.register(async () => {
    order.push(2);
  });

  await registry.runAll();
  assert.deepEqual(order, [1, 2]);
});

test('ResetRegistry unregister works correctly', async () => {
  const registry = new ResetRegistry();
  const order: number[] = [];

  const unreg = registry.register(async () => {
    order.push(1);
  });
  registry.register(async () => {
    order.push(2);
  });

  unreg();
  await registry.runAll();
  assert.deepEqual(order, [2]);
});

test('ResetRegistry rejects on failure and stops executing subsequent handlers', async () => {
  const registry = new ResetRegistry();
  const order: number[] = [];

  registry.register(async () => {
    order.push(1);
    throw new Error('fail');
  });
  registry.register(async () => {
    order.push(2);
  });

  await assert.rejects(() => registry.runAll(), /fail/);
  assert.deepEqual(order, [1]);
});
