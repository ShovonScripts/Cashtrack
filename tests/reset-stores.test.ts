import assert from 'node:assert/strict';
import test from 'node:test';

import { clearStoresInSafeOrder, type StoreResetSteps } from '../src/utils/reset-stores.ts';

function orderedSteps(order: string[], overrides: Partial<StoreResetSteps> = {}): StoreResetSteps {
  return {
    clearRestoreJournal: async () => {
      order.push('journal');
    },
    resetProviders: async () => {
      order.push('providers');
    },
    clearRelationalData: async () => {
      order.push('relational');
    },
    clearAuxiliaryData: async () => {
      order.push('auxiliary');
    },
    ...overrides,
  };
}

test('stores are cleared only after the journal and providers are reset', async () => {
  const order: string[] = [];

  await clearStoresInSafeOrder(orderedSteps(order));

  assert.deepEqual(order, ['journal', 'providers', 'relational', 'auxiliary']);
});

test('a provider reset failure aborts before any store is cleared', async () => {
  const order: string[] = [];
  const failure = new Error('provider busy');

  await assert.rejects(
    clearStoresInSafeOrder(
      orderedSteps(order, {
        resetProviders: async () => {
          order.push('providers');
          throw failure;
        },
      }),
    ),
    (error) => error === failure,
  );

  assert.deepEqual(order, ['journal', 'providers']);
});

test('a journal clear failure leaves all app data untouched', async () => {
  const order: string[] = [];
  const failure = new Error('journal locked');

  await assert.rejects(
    clearStoresInSafeOrder(
      orderedSteps(order, {
        clearRestoreJournal: async () => {
          order.push('journal');
          throw failure;
        },
      }),
    ),
    (error) => error === failure,
  );

  assert.deepEqual(order, ['journal']);
});
