import assert from 'node:assert/strict';
import test from 'node:test';

import { FINANCIAL_QUOTES } from '../src/constants/quotes.ts';
import { DEFAULT_PREFERENCES } from '../src/types/preferences.ts';
import { sanitizePreferences } from '../src/utils/preferences.ts';
import {
  getFirstName,
  getQuoteSizeRole,
  pickLaunchQuoteIndex,
} from '../src/utils/launch-quote.ts';

test('pickLaunchQuoteIndex never repeats the previous quote', () => {
  const count = 10;
  for (let last = 0; last < count; last += 1) {
    for (let r = 0; r < 1; r += 0.05) {
      const index = pickLaunchQuoteIndex(count, last, r);
      assert.notEqual(index, last);
      assert.ok(index >= 0 && index < count);
    }
  }
});

test('pickLaunchQuoteIndex can reach every other quote', () => {
  const count = 5;
  const last = 2;
  const seen = new Set<number>();
  for (let r = 0; r < 1; r += 0.01) seen.add(pickLaunchQuoteIndex(count, last, r));
  assert.deepEqual([...seen].sort(), [0, 1, 3, 4]);
});

test('pickLaunchQuoteIndex handles edge inputs', () => {
  assert.equal(pickLaunchQuoteIndex(0, null, 0.5), -1);
  assert.equal(pickLaunchQuoteIndex(1, 0, 0.5), 0);
  // Unknown or out-of-range last index: any valid index.
  assert.equal(pickLaunchQuoteIndex(4, null, 0.99), 3);
  assert.equal(pickLaunchQuoteIndex(4, 99, 0), 0);
  assert.equal(pickLaunchQuoteIndex(4, -1, 0.5), 2);
  // random of exactly 1 stays in range.
  assert.ok(pickLaunchQuoteIndex(4, 0, 1) < 4);
});

test('pickLaunchQuoteIndex works with the real quote list', () => {
  const index = pickLaunchQuoteIndex(FINANCIAL_QUOTES.length, 0);
  assert.ok(FINANCIAL_QUOTES[index]);
  assert.notEqual(index, 0);
});

test('getFirstName keeps only the first word', () => {
  assert.equal(getFirstName('  Ada   Lovelace '), 'Ada');
  assert.equal(getFirstName(''), '');
  assert.equal(getFirstName(undefined), '');
});

test('getQuoteSizeRole steps down for long quotes', () => {
  assert.equal(getQuoteSizeRole('Short and sweet.'), 'hero');
  assert.equal(getQuoteSizeRole('x'.repeat(100)), 'title');
  assert.equal(getQuoteSizeRole('x'.repeat(200)), 'subtitle');
});

test('showLaunchQuote is on by default and keeps a stored boolean', () => {
  assert.equal(DEFAULT_PREFERENCES.showLaunchQuote, true);
  assert.equal(sanitizePreferences({}).showLaunchQuote, true);
  assert.equal(sanitizePreferences({ showLaunchQuote: false }).showLaunchQuote, false);
  assert.equal(sanitizePreferences({ showLaunchQuote: 'no' }).showLaunchQuote, true);
});
