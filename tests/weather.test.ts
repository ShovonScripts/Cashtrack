import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getWeatherConditionDetails,
  getFinancialWeatherTip,
  getWeatherBackgroundColor,
  formatTemperature,
  parseOpenMeteo,
  fetchLiveWeatherData,
  type WeatherConditionType,
} from '../src/utils/weather.ts';
import {
  getWeatherBackgroundImageUrl,
  WEATHER_BACKGROUND_IMAGES,
} from '../src/constants/weather-images.ts';
import { WORLD_CITIES } from '../src/constants/world-timezones.ts';

describe('Weather utility service', () => {
  it('maps WMO weather codes accurately for day and night', () => {
    // Clear Sky
    assert.strictEqual(getWeatherConditionDetails(0, false).type, 'sunny');
    assert.strictEqual(getWeatherConditionDetails(0, true).type, 'clear-night');
    assert.strictEqual(getWeatherConditionDetails(0, true).condition, 'Clear Night');
    assert.strictEqual(getWeatherConditionDetails(0, false).icon, 'sunny');
    assert.strictEqual(getWeatherConditionDetails(0, true).icon, 'moon');

    // Partly Cloudy
    assert.strictEqual(getWeatherConditionDetails(1, false).type, 'partly-sunny');
    assert.strictEqual(getWeatherConditionDetails(2, false).type, 'partly-sunny');
    assert.strictEqual(getWeatherConditionDetails(3, true).type, 'partly-cloudy-night');

    // Foggy & Misty
    assert.strictEqual(getWeatherConditionDetails(45, false).type, 'cloudy');
    assert.strictEqual(getWeatherConditionDetails(48, false).condition, 'Foggy & Misty');

    // Rain Showers & Drizzle
    assert.strictEqual(getWeatherConditionDetails(51, false).type, 'rainy');
    assert.strictEqual(getWeatherConditionDetails(61, false).type, 'rainy');
    assert.strictEqual(getWeatherConditionDetails(82, false).type, 'rainy');

    // Snowy
    assert.strictEqual(getWeatherConditionDetails(71, false).type, 'snow');
    assert.strictEqual(getWeatherConditionDetails(75, false).type, 'snow');
    assert.strictEqual(getWeatherConditionDetails(86, false).type, 'snow');

    // Thunderstorm
    assert.strictEqual(getWeatherConditionDetails(95, false).type, 'thunderstorm');
    assert.strictEqual(getWeatherConditionDetails(99, false).type, 'thunderstorm');

    // Unknown or unmapped codes fallback
    assert.strictEqual(getWeatherConditionDetails(-1, false).type, 'cloudy');
    assert.strictEqual(getWeatherConditionDetails(-1, true).type, 'clear-night');
  });

  it('generates precise, condition-aligned financial tips for day and night', () => {
    // Night scenarios
    const nightRainTip = getFinancialWeatherTip(15, 70, 'rainy', true);
    assert.ok(nightRainTip.includes('Rainy night'));

    const nightHotTip = getFinancialWeatherTip(30, 10, 'sunny', true);
    assert.ok(nightHotTip.includes('Warm night'));

    const nightColdTip = getFinancialWeatherTip(5, 0, 'clear-night', true);
    assert.ok(nightColdTip.includes('Chilly night'));

    const nightQuietTip = getFinancialWeatherTip(20, 10, 'clear-night', true);
    assert.ok(nightQuietTip.includes('Quiet evening'));

    // Day scenarios
    const stormTip = getFinancialWeatherTip(22, 90, 'thunderstorm', false);
    assert.ok(stormTip.includes('Thunderstorm warning'));

    const heavyRainTip = getFinancialWeatherTip(18, 75, 'rainy', false);
    assert.ok(heavyRainTip.includes('High rain probability'));

    const rainTip = getFinancialWeatherTip(18, 55, 'rainy', false);
    assert.ok(rainTip.includes('Rainy weather expected'));

    const snowTip = getFinancialWeatherTip(-2, 10, 'snow', false);
    assert.ok(snowTip.includes('Snowy & cold'));

    const chillyTip = getFinancialWeatherTip(8, 0, 'cloudy', false);
    assert.ok(chillyTip.includes('Chilly weather'));

    const warmTip = getFinancialWeatherTip(32, 10, 'sunny', false);
    assert.ok(warmTip.includes('Warm & hot outside'));

    const cloudyTip = getFinancialWeatherTip(18, 20, 'cloudy', false);
    assert.ok(cloudyTip.includes('Overcast cloudy day'));

    const sunnyTip = getFinancialWeatherTip(22, 10, 'sunny', false);
    assert.ok(sunnyTip.includes('Clear sunny day'));

    const pleasantTip = getFinancialWeatherTip(22, 10, 'partly-sunny', false);
    assert.ok(pleasantTip.includes('Pleasant weather today'));
  });

  it('returns appropriate background RGBA overlay colors for all weather conditions', () => {
    const conditions: WeatherConditionType[] = [
      'sunny',
      'clear-night',
      'partly-sunny',
      'partly-cloudy-night',
      'cloudy',
      'rainy',
      'snow',
      'thunderstorm',
    ];

    conditions.forEach((cond) => {
      const color = getWeatherBackgroundColor(cond);
      assert.ok(color.startsWith('rgba('));
    });

    // Test fallback color for invalid condition type
    assert.ok(getWeatherBackgroundColor('unknown' as WeatherConditionType).startsWith('rgba('));
  });

  it('returns valid high-res background image URLs for each weather condition including clear-night', () => {
    const conditions: WeatherConditionType[] = [
      'sunny',
      'clear-night',
      'partly-sunny',
      'partly-cloudy-night',
      'cloudy',
      'rainy',
      'snow',
      'thunderstorm',
    ];

    conditions.forEach((cond) => {
      const url = getWeatherBackgroundImageUrl(cond);
      assert.ok(url.startsWith('https://'));
      assert.strictEqual(url, WEATHER_BACKGROUND_IMAGES[cond]);
    });

    // Fallback for invalid type
    const fallbackUrl = getWeatherBackgroundImageUrl('nonexistent' as WeatherConditionType);
    assert.strictEqual(fallbackUrl, WEATHER_BACKGROUND_IMAGES.sunny);
  });

  it('safely handles fetchLiveWeatherData execution when native location service is unavailable', async () => {
    // Calling fetchLiveWeatherData in node test environment without location permission options
    const result = await fetchLiveWeatherData();
    // No location module in node: an honest status, never made-up weather.
    assert.ok(result.status === 'unsupported' || result.status === 'offline');
  });

  it('sorts WORLD_CITIES alphabetically by city name with Local Time at index 0', () => {
    assert.strictEqual(WORLD_CITIES[0].id, 'local');
    assert.strictEqual(WORLD_CITIES[0].cityName, 'Local Time');

    const remainingCities = WORLD_CITIES.slice(1);
    for (let i = 0; i < remainingCities.length - 1; i++) {
      const current = remainingCities[i].cityName;
      const next = remainingCities[i + 1].cityName;
      assert.ok(
        current.localeCompare(next, undefined, { sensitivity: 'base' }) <= 0,
        `Expected "${current}" to precede or equal "${next}" alphabetically`
      );
    }
  });
});

