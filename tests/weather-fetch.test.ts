import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { fetchLiveWeatherData, type WeatherDeps } from '../src/utils/weather.ts';

type Location = NonNullable<WeatherDeps['location']>;
const never = <T,>() => new Promise<T>(() => {});
const position = { coords: { latitude: 23.81, longitude: 90.41 } };

const forecast = {
  current_weather: { temperature: 25, weathercode: 0, windspeed: 7, is_day: 0, time: '2026-11-07T22:30' },
  hourly: { time: ['2026-11-07T22:00'], temperature_2m: [25], relativehumidity_2m: [72], precipitation_probability: [0], weathercode: [0], is_day: [0] },
  daily: { time: ['2026-11-07'], weathercode: [0], temperature_2m_max: [29], temperature_2m_min: [21], precipitation_probability_max: [0] },
};

/** A location module that works, with any part overridable. */
function fakeLocation(overrides: Partial<Record<keyof Location, unknown>> = {}): Location {
  return {
    getForegroundPermissionsAsync: async () => ({ status: 'granted', canAskAgain: true }),
    requestForegroundPermissionsAsync: async () => ({ status: 'granted', canAskAgain: true }),
    hasServicesEnabledAsync: async () => true,
    getLastKnownPositionAsync: async () => position,
    getCurrentPositionAsync: async () => position,
    reverseGeocodeAsync: async () => [{ city: 'Dhaka' }],
    Accuracy: { Balanced: 3 },
    ...overrides,
  } as unknown as Location;
}

const deps = (location: Location, fetchJson: WeatherDeps['fetchJson'] = async () => forecast): WeatherDeps => ({
  location,
  fetchJson,
  timeScale: 0.002, // 15 s limits become 30 ms
});

describe('fetchLiveWeatherData', () => {
  test('works end to end', async () => {
    const result = await fetchLiveWeatherData({}, deps(fakeLocation()));
    assert.equal(result.status, 'live');
    if (result.status === 'live') {
      assert.equal(result.data.tempC, 25);
      assert.equal(result.data.locationName, 'Dhaka');
    }
  });

  test('a GPS call that never answers ends as no-fix instead of loading forever', async () => {
    const started = Date.now();
    const result = await fetchLiveWeatherData(
      {},
      deps(fakeLocation({ getLastKnownPositionAsync: never, getCurrentPositionAsync: never })),
    );
    assert.equal(result.status, 'no-fix');
    assert.ok(Date.now() - started < 2000);
  });

  test('a geocoder that never answers still shows the weather', async () => {
    const result = await fetchLiveWeatherData(
      {},
      deps(fakeLocation({ reverseGeocodeAsync: never }), async (url) => (url.includes('open-meteo') ? forecast : never())),
    );
    assert.equal(result.status, 'live');
    if (result.status === 'live') assert.equal(result.data.locationName, 'Your location');
  });

  test('falls back to an older fix when a fresh one fails', async () => {
    let calls = 0;
    const result = await fetchLiveWeatherData(
      {},
      deps(
        fakeLocation({
          getLastKnownPositionAsync: async () => (calls++ === 0 ? null : position),
          getCurrentPositionAsync: async () => {
            throw new Error('no fix');
          },
        }),
      ),
    );
    assert.equal(result.status, 'live');
  });

  test('not allowed yet, and no prompt on automatic loads', async () => {
    let asked = false;
    const result = await fetchLiveWeatherData(
      {},
      deps(
        fakeLocation({
          getForegroundPermissionsAsync: async () => ({ status: 'undetermined', canAskAgain: true }),
          requestForegroundPermissionsAsync: async () => {
            asked = true;
            return { status: 'granted', canAskAgain: true };
          },
        }),
      ),
    );
    assert.equal(result.status, 'no-permission');
    assert.equal(asked, false);
  });

  test('denied for good reports blocked, so the screen offers Settings', async () => {
    const result = await fetchLiveWeatherData(
      { requestPermission: true },
      deps(fakeLocation({ getForegroundPermissionsAsync: async () => ({ status: 'denied', canAskAgain: false }) })),
    );
    assert.equal(result.status, 'blocked');
  });

  test('Location switched off on the phone', async () => {
    const result = await fetchLiveWeatherData({}, deps(fakeLocation({ hasServicesEnabledAsync: async () => false })));
    assert.equal(result.status, 'location-off');
  });

  test('forecast service down reports offline', async () => {
    const result = await fetchLiveWeatherData(
      {},
      deps(fakeLocation(), async () => {
        throw new Error('network');
      }),
    );
    assert.equal(result.status, 'offline');
  });
});
