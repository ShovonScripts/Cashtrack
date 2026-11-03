import assert from 'node:assert/strict';
import test from 'node:test';

import { describeRecurrence, hasExtraDetails } from '../src/utils/expense-detail.ts';

test('a plain expense has nothing extra to show', () => {
  assert.equal(hasExtraDetails({}), false);
  assert.equal(hasExtraDetails({ isRecurring: false }), false);
});

test('receipts and recurring expenses open the details page', () => {
  assert.equal(hasExtraDetails({ receiptUri: 'file:///receipt.jpg' }), true);
  assert.equal(hasExtraDetails({ isRecurring: true }), true);
  assert.equal(hasExtraDetails({ recurringParentId: 'parent-1' }), true);
});

test('describes how an expense repeats', () => {
  assert.equal(describeRecurrence({}), null);
  assert.equal(describeRecurrence({ isRecurring: true, recurringFrequency: 'monthly' }), 'Every month');
  assert.equal(describeRecurrence({ isRecurring: true }), 'Repeats');
  assert.equal(describeRecurrence({ recurringParentId: 'p' }), 'Created by a recurring expense');
});
