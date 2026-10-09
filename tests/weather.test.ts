import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  getWeatherConditionDetails,
  getFinancialWeatherTip,
  DEFAULT_WEATHER_DATA,
} from '../src/utils/weather.ts';
import { getWeatherBackgroundImageUrl } from '../src/constants/weather-images.ts';

describe('Weather utility service', () => {
  it('maps weather codes accurately for day and night', () => {
    assert.strictEqual(getWeatherConditionDetails(0, false).type, 'sunny');
    assert.strictEqual(getWeatherConditionDetails(0, true).type, 'clear-night');
    assert.strictEqual(getWeatherConditionDetails(0, true).condition, 'Clear Night');
    assert.strictEqual(getWeatherConditionDetails(2, false).type, 'partly-sunny');
    assert.strictEqual(getWeatherConditionDetails(61, false).type, 'rainy');
    assert.strictEqual(getWeatherConditionDetails(73, false).type, 'snow');
    assert.strictEqual(getWeatherConditionDetails(95, false).type, 'thunderstorm');
  });

  it('generates precise, condition-aligned financial tips for day and night', () => {
    const stormTip = getFinancialWeatherTip(22, 90, 'thunderstorm', false);
    assert.ok(stormTip.toLowerCase().includes('thunderstorm') || stormTip.toLowerCase().includes('indoors'));

    const rainyTip = getFinancialWeatherTip(20, 80, 'rainy', false);
    assert.ok(rainyTip.toLowerCase().includes('rain') || rainyTip.toLowerCase().includes('coffee'));

    const warmTip = getFinancialWeatherTip(30, 10, 'sunny', false);
    assert.ok(warmTip.toLowerCase().includes('warm') || warmTip.toLowerCase().includes('water'));

    const nightTip = getFinancialWeatherTip(24, 10, 'clear-night', true);
    assert.ok(nightTip.toLowerCase().includes('night') || nightTip.toLowerCase().includes('evening'));

    const chillyTip = getFinancialWeatherTip(5, 10, 'snow', false);
    assert.ok(chillyTip.toLowerCase().includes('snowy') || chillyTip.toLowerCase().includes('drinks'));

    const cloudyTip = getFinancialWeatherTip(18, 20, 'cloudy', false);
    assert.ok(cloudyTip.toLowerCase().includes('cloudy') || cloudyTip.toLowerCase().includes('overcast'));

    const pleasantTip = getFinancialWeatherTip(22, 10, 'partly-sunny', false);
    assert.ok(pleasantTip.toLowerCase().includes('pleasant') || pleasantTip.toLowerCase().includes('walk'));
  });

  it('provides comprehensive default fallback weather data', () => {
    assert.ok(typeof DEFAULT_WEATHER_DATA.tempC === 'number');
    assert.ok(typeof DEFAULT_WEATHER_DATA.financialTip === 'string');
    assert.ok(DEFAULT_WEATHER_DATA.financialTip.length > 0);
  });

  it('returns valid high-res background image URLs for each weather condition including clear-night', () => {
    const sunnyImg = getWeatherBackgroundImageUrl('sunny');
    const nightImg = getWeatherBackgroundImageUrl('clear-night');
    const rainyImg = getWeatherBackgroundImageUrl('rainy');
    const stormImg = getWeatherBackgroundImageUrl('thunderstorm');

    assert.ok(sunnyImg.startsWith('http'));
    assert.ok(nightImg.startsWith('http'));
    assert.ok(rainyImg.startsWith('http'));
    assert.ok(stormImg.startsWith('http'));
    assert.notStrictEqual(sunnyImg, nightImg);
  });
});
