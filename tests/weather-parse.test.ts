import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  formatTemperature,
  getFinancialWeatherTip,
  parseOpenMeteo,
  type OpenMeteoResponse,
} from '../src/utils/weather.ts';

const hours = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => `2026-11-07T${String((from + i) % 24).padStart(2, '0')}:00`);

const sample = (): OpenMeteoResponse => ({
  current_weather: { temperature: 24.4, weathercode: 2, windspeed: 0, is_day: 1, time: '2026-11-07T14:15' },
  hourly: {
    time: hours(12, 30),
    temperature_2m: Array.from({ length: 30 }, (_, i) => 20 + i * 0.5),
    precipitation_probability: Array.from({ length: 30 }, () => 60),
    relativehumidity_2m: Array.from({ length: 30 }, () => 71),
    weathercode: Array.from({ length: 30 }, () => 2),
    is_day: Array.from({ length: 30 }, (_, i) => (i < 6 ? 1 : 0)),
  },
  daily: {
    time: ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12'],
    weathercode: [2, 61, 0, 3, 95, 0],
    temperature_2m_max: [27, 25, 26, 24, 23, 22],
    temperature_2m_min: [18, 17, 16, 15, 14, 13],
    precipitation_probability_max: [65, 80, 5, 30, 90, 0],
  },
});

describe('parseOpenMeteo', () => {
  test('uses the real numbers, with no caps or invented fallbacks', () => {
    const w = parseOpenMeteo(sample(), 'Dhaka', 1000);
    assert.ok(w);
    assert.equal(w.tempC, 24);
    // Partly cloudy sky with a 60% chance of rain stays 60% (it used to be capped at 20%).
    assert.equal(w.rainProbability, 60);
    // Calm air is 0 km/h (it used to show 12).
    assert.equal(w.windSpeedKmH, 0);
    assert.equal(w.humidity, 71);
    assert.equal(w.locationName, 'Dhaka');
    assert.equal(w.fetchedAt, 1000);
  });

  test('starts the hourly list at the current hour, labelled in the place’s own time', () => {
    const w = parseOpenMeteo(sample(), 'Dhaka', 0)!;
    assert.equal(w.hourlyForecast.length, 24);
    assert.equal(w.hourlyForecast[0].hourLabel, 'Now');
    assert.equal(w.hourlyForecast[0].time, '2026-11-07T14:00');
    assert.equal(w.hourlyForecast[1].hourLabel, '3 PM');
    assert.equal(w.hourlyForecast[10].hourLabel, '12 AM');
  });

  test('partly cloudy at night gets the night type', () => {
    const w = parseOpenMeteo(sample(), 'x', 0)!;
    const night = w.hourlyForecast.find((h) => h.isNight);
    assert.equal(night?.conditionType, 'partly-cloudy-night');
  });

  test('five days, real rain chances', () => {
    const w = parseOpenMeteo(sample(), 'x', 0)!;
    assert.equal(w.dailyForecast.length, 5);
    assert.equal(w.dailyForecast[0].dayName, 'Today');
    assert.equal(w.dailyForecast[1].dayName, 'Tomorrow');
    assert.deepEqual(
      w.dailyForecast.map((d) => d.rainProbability),
      [65, 80, 5, 30, 90],
    );
  });

  test('missing humidity is reported as unknown, not 50%', () => {
    const data = sample();
    delete data.hourly!.relativehumidity_2m;
    assert.equal(parseOpenMeteo(data, 'x', 0)!.humidity, null);
  });

  test('no current reading means no weather', () => {
    assert.equal(parseOpenMeteo({}, 'x', 0), null);
  });
});

describe('temperatures in the person’s unit', () => {
  test('formatTemperature', () => {
    assert.equal(formatTemperature(28, 'C'), '28°C');
    assert.equal(formatTemperature(28, 'F'), '82°F');
    assert.equal(formatTemperature(28, 'F', false), '82°');
  });

  test('tips follow the unit', () => {
    const tip = getFinancialWeatherTip(30, 10, 'sunny', true, 'F');
    assert.ok(tip.includes('86°F'));
    assert.ok(!tip.includes('°C'));
  });
});
