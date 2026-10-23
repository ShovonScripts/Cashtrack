import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { applyCategoryOrder, moveCategoryInOrder } from '../src/utils/category-order.ts';

const DEFAULTS = ['Food', 'Transport', 'Shopping', 'Other'];

describe('applyCategoryOrder', () => {
  it('keeps the saved order', () => {
    assert.deepEqual(
      applyCategoryOrder(DEFAULTS, ['Other', 'Food', 'Transport', 'Shopping']),
      ['Other', 'Food', 'Transport', 'Shopping'],
    );
  });

  it('appends categories missing from the saved order', () => {
    assert.deepEqual(
      applyCategoryOrder(DEFAULTS, ['Shopping', 'Other']),
      ['Shopping', 'Other', 'Food', 'Transport'],
    );
  });

  it('ignores unknown and duplicate names', () => {
    assert.deepEqual(
      applyCategoryOrder(DEFAULTS, ['Food', 'Missing', 'Food', 'Other']),
      ['Food', 'Other', 'Transport', 'Shopping'],
    );
  });

  it('uses the default order when nothing is saved', () => {
    assert.deepEqual(applyCategoryOrder(DEFAULTS, undefined), DEFAULTS);
    assert.deepEqual(applyCategoryOrder(DEFAULTS, []), DEFAULTS);
  });
});

describe('moveCategoryInOrder', () => {
  it('moves a category up and down by one position', () => {
    assert.deepEqual(
      moveCategoryInOrder(DEFAULTS, 'Shopping', 'up'),
      ['Food', 'Shopping', 'Transport', 'Other'],
    );
    assert.deepEqual(
      moveCategoryInOrder(DEFAULTS, 'Shopping', 'down'),
      ['Food', 'Transport', 'Other', 'Shopping'],
    );
  });

  it('does not move past the boundaries', () => {
    assert.equal(moveCategoryInOrder(DEFAULTS, 'Food', 'up'), DEFAULTS);
    assert.equal(moveCategoryInOrder(DEFAULTS, 'Other', 'down'), DEFAULTS);
  });

  it('does not change anything for an unknown category', () => {
    assert.equal(moveCategoryInOrder(DEFAULTS, 'Missing', 'down'), DEFAULTS);
  });

  it('does not mutate the input array', () => {
    const input = [...DEFAULTS];
    moveCategoryInOrder(input, 'Transport', 'down');
    assert.deepEqual(input, DEFAULTS);
  });
});
