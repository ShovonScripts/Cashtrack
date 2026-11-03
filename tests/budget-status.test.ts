import assert from 'node:assert/strict';
import test from 'node:test';

import { getBudgetStatus } from '../src/utils/budget-status.ts';

test('under 80% is on track', () => {
  const status = getBudgetStatus(50, 100);
  assert.equal(status.state, 'ok');
  assert.equal(status.percent, 50);
  assert.equal(status.fill, 0.5);
  assert.equal(status.remaining, 50);
});

test('80% and up is near the limit, including exactly 100%', () => {
  assert.equal(getBudgetStatus(80, 100).state, 'near');
  assert.equal(getBudgetStatus(100, 100).state, 'near');
  assert.equal(getBudgetStatus(100, 100).remaining, 0);
});

test('past the cap is over, and percent keeps counting', () => {
  const status = getBudgetStatus(130, 100);
  assert.equal(status.state, 'over');
  assert.equal(status.percent, 130);
  assert.equal(status.fill, 1);
  assert.equal(status.remaining, -30);
  assert.equal(status.label, 'Over limit');
});

test('invalid numbers never throw or report over', () => {
  assert.equal(getBudgetStatus(Number.NaN, 100).state, 'ok');
  assert.equal(getBudgetStatus(50, 0).state, 'ok');
  assert.equal(getBudgetStatus(-5, 100).percent, 0);
});
