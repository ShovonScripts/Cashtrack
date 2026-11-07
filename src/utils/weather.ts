export type WeatherConditionType =
  | 'sunny'
  | 'clear-night'
  | 'partly-sunny'
  | 'partly-cloudy-night'
  | 'cloudy'
  | 'rainy'
  | 'snow'
  | 'thunderstorm';

export interface WeatherConditionInfo {
  condition: string;
  icon: 'sunny' | 'moon' | 'partly-sunny' | 'cloudy' | 'rainy' | 'snow' | 'thunderstorm';
  type: WeatherConditionType;
}

export type TemperatureUnit = 'C' | 'F';

const WEATHER_REQUEST_TIMEOUT_MS = 10_000;

async function fetchJson(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WEATHER_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}`);
    }
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timeout);
  }
}

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  tempC: number;
  rainProbability: number;
  weatherCode: number;
  conditionType: WeatherConditionType;
  isNight: boolean;
}

export interface DailyForecastItem {
  date: string;
  dayName: string;
  tempMaxC: number;
  tempMinC: number;
  rainProbability: number;
  weatherCode: number;
  condition: string;
  conditionType: WeatherConditionType;
}

export interface WeatherData {
  tempC: number;
  tempMaxC: number;
  tempMinC: number;
  rainProbability: number; // 0 - 100%
  /** 0 - 100%, or null when the forecast did not include it. */
  humidity: number | null;
  windSpeedKmH: number;
  weatherCode: number;
  condition: string;
  conditionType: WeatherConditionType;
  locationName: string;
  isNight: boolean;
  hourlyForecast: HourlyForecastItem[];
  dailyForecast: DailyForecastItem[];
  /** When this reading was fetched (ms since epoch). */
  fetchedAt: number;
}

export function getWeatherConditionDetails(code: number, isNight: boolean = false): WeatherConditionInfo {
  if (code === 0) {
    if (isNight) {
      return { condition: 'Clear Night', icon: 'moon', type: 'clear-night' };
    }
    return { condition: 'Sunny & Clear', icon: 'sunny', type: 'sunny' };
  }
  if (code >= 1 && code <= 3) {
    if (isNight) {
      return { condition: 'Partly Cloudy', icon: 'moon', type: 'partly-cloudy-night' };
    }
    return { condition: 'Partly Cloudy', icon: 'partly-sunny', type: 'partly-sunny' };
  }
  if (code >= 45 && code <= 48) {
    return { condition: 'Foggy & Misty', icon: 'cloudy', type: 'cloudy' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'Rain Showers', icon: 'rainy', type: 'rainy' };
  }
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return { condition: 'Snowy', icon: 'snow', type: 'snow' };
  }
  if (code >= 95) {
    return { condition: 'Thunderstorm', icon: 'thunderstorm', type: 'thunderstorm' };
  }
  return { condition: isNight ? 'Calm Night' : 'Pleasant Breeze', icon: isNight ? 'moon' : 'cloudy', type: isNight ? 'clear-night' : 'cloudy' };
}

/** "24°C" / "75°F", or just "24°" with `withUnit: false`. Input is always Celsius. */
export function formatTemperature(tempC: number, unit: TemperatureUnit = 'C', withUnit = true): string {
  const value = unit === 'F' ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC);
  return `${value}°${withUnit ? unit : ''}`;
}

/**
 * A money tip that matches the weather. Thresholds are in Celsius; the
 * temperature in the text follows the person's unit.
 */
export function getFinancialWeatherTip(
  tempC: number,
  rainProb: number,
  conditionType: WeatherConditionType,
  isNight: boolean = false,
  unit: TemperatureUnit = 'C'
): string {
  const t = formatTemperature(tempC, unit);

  // Nighttime specific tips
  if (isNight) {
    if (conditionType === 'thunderstorm' || conditionType === 'rainy' || rainProb >= 60) {
      return `Rainy night outside (${t})! Stay cozy indoors, skip late-night takeout orders, and save.`;
    }
    if (tempC >= 28) {
      return `Warm night (${t})! Keep your home cool efficiently and review your daily expense log in CashTrack.`;
    }
    if (tempC <= 10) {
      return `Chilly night (${t})! Perfect time to relax indoors and double-check your monthly savings pots.`;
    }
    return `Quiet evening (${t})! Take a minute to record today's purchases and keep your cash flow on target.`;
  }

  // Daytime tips
  if (conditionType === 'thunderstorm') {
    return 'Thunderstorm warning today! Stay safely indoors, avoid unnecessary delivery fees, and review your monthly savings pots.';
  }

  if (conditionType === 'rainy' || rainProb >= 50) {
    if (rainProb >= 70) {
      return `High rain probability (${rainProb}%)! Avoid costly last-minute rideshares by planning travel ahead or staying cozy at home.`;
    }
    return `Rainy weather expected (${rainProb}% rain)! Great day to brew coffee at home, meal prep, and save on eating out.`;
  }

  if (conditionType === 'snow' || tempC <= 0) {
    return `Snowy & cold outside (${t})! Enjoy hot drinks at home and keep a close eye on winter heating and utility costs.`;
  }

  if (tempC < 12) {
    return `Chilly weather (${t})! Perfect time to stay warm inside and organize your monthly category budget limits.`;
  }

  if (tempC >= 28) {
    return `Warm & hot outside (${t})! Carry a reusable water bottle and iced beverage to avoid expensive café markups.`;
  }

  if (conditionType === 'cloudy') {
    return `Overcast cloudy day (${t})! Ideal weather for a peaceful walk or organizing your financial records in CashTrack.`;
  }

  if (conditionType === 'sunny') {
    return `Clear sunny day (${t})! Take advantage of free park activities and outdoor leisure to keep your spending low.`;
  }

  if (conditionType === 'partly-sunny') {
    return `Pleasant weather today (${t})! Walk or cycle for short local errands to save money on fuel and transit.`;
  }

  return `Mindful spending check (${t}) — keep your daily coffee, snack, and small expenses on budget today!`;
}

export function getWeatherBackgroundColor(conditionType: WeatherConditionType): string {
  switch (conditionType) {
    case 'sunny':
      return 'rgba(217, 119, 6, 0.48)';
    case 'clear-night':
    case 'partly-cloudy-night':
      return 'rgba(15, 23, 42, 0.65)';
    case 'partly-sunny':
      return 'rgba(14, 165, 233, 0.42)';
    case 'cloudy':
      return 'rgba(51, 65, 85, 0.55)';
    case 'rainy':
      return 'rgba(30, 58, 138, 0.58)';
    case 'snow':
      return 'rgba(14, 116, 144, 0.48)';
    case 'thunderstorm':
      return 'rgba(88, 28, 135, 0.62)';
    default:
      return 'rgba(0, 0, 0, 0.45)';
  }
}

/** Open-Meteo `forecast` response, as much of it as we read. */
export type OpenMeteoResponse = {
  current_weather?: { temperature: number; weathercode: number; windspeed?: number; is_day: number; time: string };
  daily?: {
    time?: string[];
    weathercode?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    relativehumidity_2m?: number[];
    weathercode?: number[];
    is_day?: number[];
  };
};

/** "2026-11-07T15:00" (already in the place's own time) -> "3 PM". */
function hourLabelFromLocalIso(iso: string): string {
  const hour = Number(iso.slice(11, 13));
  if (!Number.isFinite(hour)) return '';
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12} ${hour >= 12 ? 'PM' : 'AM'}`;
}

/**
 * Turns an Open-Meteo response into what the screens show. Pure: no network,
 * no location. Every number comes from the forecast; nothing is invented or
 * capped. Returns null when there is no current reading.
 */
export function parseOpenMeteo(data: OpenMeteoResponse, locationName: string, fetchedAt: number): WeatherData | null {
  const current = data.current_weather;
  if (!current || !Number.isFinite(current.temperature)) return null;

  const tempC = Math.round(current.temperature);
  const weatherCode = current.weathercode;
  const windSpeedKmH = Math.round(current.windspeed ?? 0);
  const isNight = current.is_day === 0;

  const tempMaxC = Math.round(data.daily?.temperature_2m_max?.[0] ?? tempC);
  const tempMinC = Math.round(data.daily?.temperature_2m_min?.[0] ?? tempC);

  // Open-Meteo reports the current reading on a 15-minute step; the hourly
  // series is on the hour, so match on "YYYY-MM-DDTHH".
  let startHourIndex = 0;
  if (data.hourly?.time) {
    const idx = data.hourly.time.findIndex((t) => t.slice(0, 13) === current.time.slice(0, 13));
    if (idx >= 0) startHourIndex = idx;
  }

  const hourlyRain = data.hourly?.precipitation_probability?.[startHourIndex];
  const rainProbability = Math.round(hourlyRain ?? data.daily?.precipitation_probability_max?.[0] ?? 0);
  const rawHumidity = data.hourly?.relativehumidity_2m?.[startHourIndex];
  const humidity = rawHumidity === undefined || rawHumidity === null ? null : Math.round(rawHumidity);
  const condDetails = getWeatherConditionDetails(weatherCode, isNight);

  const hourlyForecast: HourlyForecastItem[] = [];
  if (data.hourly?.time && data.hourly.temperature_2m) {
    const end = Math.min(startHourIndex + 24, data.hourly.time.length);
    for (let i = startHourIndex; i < end; i++) {
      const time = data.hourly.time[i];
      const code = data.hourly.weathercode?.[i] ?? weatherCode;
      const night = data.hourly.is_day?.[i] === 0;
      hourlyForecast.push({
        time,
        hourLabel: i === startHourIndex ? 'Now' : hourLabelFromLocalIso(time),
        tempC: Math.round(data.hourly.temperature_2m[i]),
        rainProbability: Math.round(data.hourly.precipitation_probability?.[i] ?? 0),
        weatherCode: code,
        conditionType: getWeatherConditionDetails(code, night).type,
        isNight: night,
      });
    }
  }

  const dailyForecast: DailyForecastItem[] = [];
  const days = data.daily?.time ?? [];
  for (let i = 0; i < Math.min(5, days.length); i++) {
    const date = days[i];
    // Date-only strings parse as UTC midnight; anchor at local noon so the
    // weekday label is right west of UTC.
    const dayName =
      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Intl.DateTimeFormat('en', { weekday: 'short' }).format(new Date(`${date}T12:00:00`));
    const code = data.daily?.weathercode?.[i] ?? 0;
    const details = getWeatherConditionDetails(code, false);
    dailyForecast.push({
      date,
      dayName,
      tempMaxC: Math.round(data.daily?.temperature_2m_max?.[i] ?? tempMaxC),
      tempMinC: Math.round(data.daily?.temperature_2m_min?.[i] ?? tempMinC),
      rainProbability: Math.round(data.daily?.precipitation_probability_max?.[i] ?? 0),
      weatherCode: code,
      condition: details.condition,
      conditionType: details.type,
    });
  }

  return {
    tempC,
    tempMaxC,
    tempMinC,
    rainProbability,
    humidity,
    windSpeedKmH,
    weatherCode,
    condition: condDetails.condition,
    conditionType: condDetails.type,
    locationName,
    isNight,
    hourlyForecast,
    dailyForecast,
    fetchedAt,
  };
}

/** Why there is (or is not) live weather. Screens show a message for each, never made-up numbers. */
export type WeatherResult =
  | { status: 'live'; data: WeatherData }
  /** Not allowed yet; asking will show the system prompt. */
  | { status: 'no-permission' }
  /** Denied for good; only the phone's Settings can allow it now. */
  | { status: 'blocked' }
  /** Allowed, but Location is switched off on the phone. */
  | { status: 'location-off' }
  /** Location is on but the phone could not get a fix in time. */
  | { status: 'no-fix' }
  /** The forecast service could not be reached. */
  | { status: 'offline' }
  | { status: 'unsupported' };

/** Rejects after `ms`, so a stuck native call can never freeze the weather. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Live weather from Open-Meteo for the phone's location.
 *
 * Permission is only requested when the caller says the request came from a
 * deliberate user action. Automatic loads use an existing grant and otherwise
 * report `no-permission`, so the app never prompts on launch. Every native
 * call has a time limit, so the result always arrives within about 30 seconds.
 */
type LocationApi = typeof import('expo-location');

/** Test seams: a fake location module, a fake network, and shorter time limits. */
export type WeatherDeps = {
  location?: Pick<
    LocationApi,
    | 'getForegroundPermissionsAsync'
    | 'requestForegroundPermissionsAsync'
    | 'hasServicesEnabledAsync'
    | 'getLastKnownPositionAsync'
    | 'getCurrentPositionAsync'
    | 'reverseGeocodeAsync'
    | 'Accuracy'
  >;
  fetchJson?: (url: string) => Promise<unknown>;
  /** Multiplies every time limit; tests use a small number. */
  timeScale?: number;
};

export async function fetchLiveWeatherData(
  options: { requestPermission?: boolean } = {},
  deps: WeatherDeps = {},
): Promise<WeatherResult> {
  let Location: NonNullable<WeatherDeps['location']>;
  try {
    Location = deps.location ?? (await import('expo-location'));
  } catch {
    return { status: 'unsupported' };
  }
  const getJson = deps.fetchJson ?? fetchJson;
  const ms = (value: number) => value * (deps.timeScale ?? 1);

  // 1. Permission.
  try {
    let permission = await withTimeout(Location.getForegroundPermissionsAsync(), ms(5000));
    if (permission.status !== 'granted' && options.requestPermission && permission.canAskAgain) {
      // No time limit: this waits for the person to answer the system prompt.
      permission = await Location.requestForegroundPermissionsAsync();
    }
    if (permission.status !== 'granted') {
      return { status: permission.canAskAgain ? 'no-permission' : 'blocked' };
    }
  } catch {
    return { status: 'unsupported' };
  }

  // 2. Location switched on? (Not every platform can tell; assume yes if unsure.)
  const servicesOn = await withTimeout(Location.hasServicesEnabledAsync(), ms(5000)).catch(() => true);
  if (!servicesOn) return { status: 'location-off' };

  // 3. Position: a recent fix, else a fresh one, else any fix the phone remembers.
  const position =
    (await withTimeout(Location.getLastKnownPositionAsync({ maxAge: 15 * 60_000 }), ms(5000)).catch(() => null)) ??
    (await withTimeout(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), ms(15_000)).catch(() => null)) ??
    (await withTimeout(Location.getLastKnownPositionAsync(), ms(5000)).catch(() => null));
  if (!position) return { status: 'no-fix' };
  const { latitude, longitude } = position.coords;

  // 4. Forecast.
  let raw: OpenMeteoResponse;
  try {
    raw = (await getJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,precipitation_probability,weathercode,windspeed_10m,is_day&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    )) as OpenMeteoResponse;
  } catch {
    return { status: 'offline' };
  }

  // 5. City name (never blocks the weather for long).
  const locationName = await withTimeout(resolveCityName(Location, latitude, longitude, getJson, ms), ms(12_000)).catch(() => 'Your location');
  const data = parseOpenMeteo(raw, locationName, Date.now());
  return data ? { status: 'live', data } : { status: 'offline' };
}

async function resolveCityName(
  Location: Pick<LocationApi, 'reverseGeocodeAsync'>,
  latitude: number,
  longitude: number,
  getJson: (url: string) => Promise<unknown>,
  ms: (value: number) => number,
): Promise<string> {
  try {
    const [place] = await withTimeout(Location.reverseGeocodeAsync({ latitude, longitude }), ms(6000));
    const city = place?.city || place?.subregion || place?.region;
    if (city) return city;
  } catch {}

  try {
    const geo = (await getJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
    )) as { city?: string; locality?: string; principalSubdivision?: string };
    const city = geo.city || geo.locality || geo.principalSubdivision;
    if (city) return city;
  } catch {}

  return 'Your location';
}
