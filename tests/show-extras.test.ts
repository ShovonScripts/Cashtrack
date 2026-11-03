import assert from 'node:assert/strict';
import test from 'node:test';

import { sanitizePreferences } from '../src/utils/preferences.ts';
import { DEFAULT_PREFERENCES } from '../src/types/preferences.ts';

test('showExtras is off by default', () => {
  assert.equal(DEFAULT_PREFERENCES.showExtras, false);
  assert.equal(sanitizePreferences({}).showExtras, false);
});

test('showExtras keeps a stored boolean and rejects other types', () => {
  assert.equal(sanitizePreferences({ showExtras: true }).showExtras, true);
  assert.equal(sanitizePreferences({ showExtras: 'yes' }).showExtras, false);
});
