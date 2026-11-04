import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { WORLD_CITIES } from '../src/constants/world-timezones.ts';
import { CITY_PHOTOS, getCityPhoto } from '../src/constants/city-photos.ts';

describe('world clock city photos', () => {
  test('every city except Local Time has a photo', () => {
    const missing = WORLD_CITIES.filter((city) => city.id !== 'local' && !CITY_PHOTOS[city.id]).map((city) => city.id);
    assert.deepEqual(missing, []);
  });

  test('no photo belongs to an unknown city', () => {
    const ids = new Set(WORLD_CITIES.map((city) => city.id));
    const extra = Object.keys(CITY_PHOTOS).filter((id) => !ids.has(id));
    assert.deepEqual(extra, []);
  });

  test('photo links are https images with a source page', () => {
    for (const [id, photo] of Object.entries(CITY_PHOTOS)) {
      assert.match(photo.uri, /^https:\/\/thumb\.wikimedia\.org\/.+\.(jpe?g|png|webp)$/i, id);
      assert.match(photo.source, /^https:\/\/en\.wikipedia\.org\/wiki\//, id);
    }
  });

  test('Local Time and unknown ids have no photo', () => {
    assert.equal(getCityPhoto('local'), null);
    assert.equal(getCityPhoto('nowhere'), null);
  });
});
