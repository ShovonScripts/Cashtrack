import assert from 'node:assert/strict';
import test from 'node:test';

import { DEFAULT_PREFERENCES } from '../src/types/preferences.ts';
import { sanitizePreferences } from '../src/utils/preferences.ts';
import { getFirstName, getQuoteSizeRole } from '../src/utils/launch-quote.ts';

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

test('quoteTopics defaults to every topic and keeps only known, unique topics', () => {
  assert.deepEqual(DEFAULT_PREFERENCES.quoteTopics, []);
  assert.deepEqual(sanitizePreferences({}).quoteTopics, []);
  assert.deepEqual(sanitizePreferences({ quoteTopics: 'saving' }).quoteTopics, []);
  assert.deepEqual(
    sanitizePreferences({ quoteTopics: ['saving', 'nope', 'debt', 'saving', 42] }).quoteTopics,
    ['saving', 'debt'],
  );
});
