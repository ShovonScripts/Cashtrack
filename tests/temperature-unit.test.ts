import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultTemperatureUnit, sanitizePreferences } from '../src/utils/preferences.ts';

describe('temperature unit follows the country until chosen', () => {
  test('country defaults', () => {
    assert.equal(defaultTemperatureUnit('BD'), 'C');
    assert.equal(defaultTemperatureUnit('GB'), 'C');
    assert.equal(defaultTemperatureUnit('IN'), 'C');
    assert.equal(defaultTemperatureUnit('US'), 'F');
  });

  test('an old save with °F nobody chose becomes the country default', () => {
    const prefs = sanitizePreferences({ countryCode: 'BD', temperatureUnit: 'F' });
    assert.equal(prefs.temperatureUnit, 'C');
    assert.equal(prefs.temperatureUnitChosen, false);
  });

  test('a unit the person picked is kept, even if unusual for the country', () => {
    const prefs = sanitizePreferences({ countryCode: 'BD', temperatureUnit: 'F', temperatureUnitChosen: true });
    assert.equal(prefs.temperatureUnit, 'F');
    assert.equal(prefs.temperatureUnitChosen, true);
  });

  test('US users get °F by default', () => {
    assert.equal(sanitizePreferences({ countryCode: 'US' }).temperatureUnit, 'F');
  });
});
