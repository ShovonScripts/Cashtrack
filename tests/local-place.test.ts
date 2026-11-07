import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  cityForZone,
  cityNameFromZone,
  dayPhase,
  flagFromCountryCode,
  greetingFor,
  placeFromAddress,
  placeFromZone,
} from '../src/utils/local-place.ts';
import { parsePlacePhoto } from '../src/utils/place-photo.ts';

describe('time zone to place', () => {
  test('zone city names', () => {
    assert.equal(cityNameFromZone('America/Argentina/Buenos_Aires'), 'Buenos Aires');
    assert.equal(cityNameFromZone('Asia/Dhaka'), 'Dhaka');
  });

  test('prefers the city the zone is named after', () => {
    assert.equal(cityForZone('America/New_York')?.id, 'nyc');
    assert.equal(cityForZone('Asia/Dhaka')?.id, 'dhaka');
  });

  test('unknown zone falls back to its own city name and a photo query', () => {
    const place = placeFromZone('Asia/Thimphu_Test');
    assert.equal(place.area, 'Thimphu Test');
    assert.equal(place.region, 'Asia');
    assert.equal(place.cityId, null);
    assert.equal(place.photoQuery, 'Thimphu Test');
    assert.equal(place.source, 'zone');
  });

  test('empty zone still gives a readable card', () => {
    assert.equal(placeFromZone('').area, 'Your time');
  });
});

describe('address to place', () => {
  test('district first, then city and country, with a curated photo', () => {
    const place = placeFromAddress({ district: 'Mirpur', city: 'Dhaka', country: 'Bangladesh', isoCountryCode: 'BD' });
    assert.deepEqual(place, {
      area: 'Mirpur',
      region: 'Dhaka, Bangladesh',
      flag: '🇧🇩',
      cityId: 'dhaka',
      photoQuery: null,
      source: 'gps',
    });
  });

  test('city not in the list asks for a photo by name', () => {
    const place = placeFromAddress({ city: 'Sylhet', country: 'Bangladesh', isoCountryCode: 'BD' });
    assert.equal(place?.area, 'Sylhet');
    assert.equal(place?.region, 'Bangladesh');
    assert.equal(place?.cityId, null);
    assert.equal(place?.photoQuery, 'Sylhet');
  });

  test('no names at all gives null', () => {
    assert.equal(placeFromAddress({ country: null }), null);
  });
});

describe('small helpers', () => {
  test('flags', () => {
    assert.equal(flagFromCountryCode('bd'), '🇧🇩');
    assert.equal(flagFromCountryCode('USA'), '📍');
    assert.equal(flagFromCountryCode(null), '📍');
  });

  test('day phases and greetings', () => {
    assert.equal(dayPhase(6), 'dawn');
    assert.equal(dayPhase(12), 'day');
    assert.equal(dayPhase(18), 'dusk');
    assert.equal(dayPhase(23), 'night');
    assert.equal(greetingFor(9), 'Good morning');
    assert.equal(greetingFor(22), 'Good night');
  });

  test('photo parser skips maps and flags', () => {
    const photo = (source: string) => ({ query: { pages: [{ thumbnail: { source } }] } });
    assert.equal(parsePlacePhoto(photo('https://x/Sylhet_city.jpg')), 'https://x/Sylhet_city.jpg');
    assert.equal(parsePlacePhoto(photo('https://x/Sylhet_locator_map.png')), null);
    assert.equal(parsePlacePhoto(photo('https://x/Flag.svg.png')), null);
    assert.equal(parsePlacePhoto({}), null);
  });
});
