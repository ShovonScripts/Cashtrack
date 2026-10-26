import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyRestoreWithRollback,
  RestoreRollbackError,
} from '../src/utils/restore-rollback.ts';

test('a successful restore does not roll back', async () => {
  const calls: string[] = [];

  await applyRestoreWithRollback(
    { previous: true },
    async () => {
      calls.push('apply');
    },
    async () => {
      calls.push('rollback');
    },
  );

  assert.deepEqual(calls, ['apply']);
});

test('a failed restore restores the snapshot and rethrows the original error', async () => {
  const calls: string[] = [];
  const original = new Error('write failed');

  await assert.rejects(
    applyRestoreWithRollback(
      { previous: true },
      async () => {
        calls.push('apply');
        throw original;
      },
      async (snapshot) => {
        calls.push(`rollback:${snapshot.previous}`);
      },
    ),
    (error) => error === original,
  );

  assert.deepEqual(calls, ['apply', 'rollback:true']);
});

test('a failed rollback reports both errors', async () => {
  const original = new Error('write failed');
  const rollbackError = new Error('rollback failed');

  await assert.rejects(
    applyRestoreWithRollback(
      'snapshot',
      async () => {
        throw original;
      },
      async () => {
        throw rollbackError;
      },
    ),
    (error) => {
      assert.ok(error instanceof RestoreRollbackError);
      assert.equal(error.originalError, original);
      assert.equal(error.rollbackError, rollbackError);
      return true;
    },
  );
});
