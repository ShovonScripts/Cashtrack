export type WeatherConditionType =
  | 'sunny'
  | 'clear-night'
  | 'partly-sunny'
  | 'cloudy'
  | 'rainy'
  | 'snow'
  | 'thunderstorm';

export interface WeatherConditionInfo {
  condition: string;
  icon: 'sunny' | 'moon' | 'partly-sunny' | 'cloudy' | 'rainy' | 'snow' | 'thunderstorm';
  type: WeatherConditionType;
}

export interface WeatherData {
  tempC: number;
  tempMaxC: number;
  tempMinC: number;
  rainProbability: number; // 0 - 100%
  humidity: number; // 0 - 100%
  windSpeedKmH: number;
  weatherCode: number;
  condition: string;
  conditionType: WeatherConditionType;
  locationName: string;
  financialTip: string;
  isNight: boolean;
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
      return { condition: 'Partly Cloudy Night', icon: 'moon', type: 'partly-sunny' };
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

/**
 * Returns a highly precise, weather-aligned financial tip tailored to exact
 * weather conditions, temperatures, rain probability, and day/night status.
 */
export function getFinancialWeatherTip(
  tempC: number,
  rainProb: number,
  conditionType: WeatherConditionType,
  isNight: boolean = false
): string {
  // Nighttime specific tips
  if (isNight) {
    if (conditionType === 'thunderstorm' || conditionType === 'rainy' || rainProb >= 60) {
      return `Rainy night outside (${tempC}°C)! Stay cozy indoors, skip late-night takeout orders, and save.`;
    }
    if (tempC >= 28) {
      return `Warm night (${tempC}°C)! Keep your home cool efficiently and review your daily expense log in CashTrack.`;
    }
    if (tempC <= 10) {
      return `Chilly night (${tempC}°C)! Perfect time to relax indoors and double-check your monthly savings pots.`;
    }
    return `Quiet evening (${tempC}°C)! Take a minute to record today's purchases and keep your cash flow on target.`;
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
    return `Snowy & cold outside (${tempC}°C)! Enjoy hot drinks at home and keep a close eye on winter heating and utility costs.`;
  }

  if (tempC < 12) {
    return `Chilly weather (${tempC}°C)! Perfect time to stay warm inside and organize your monthly category budget limits.`;
  }

  if (tempC >= 28) {
    return `Warm & hot outside (${tempC}°C)! Carry a reusable water bottle and iced beverage to avoid expensive café markups.`;
  }

  if (conditionType === 'cloudy') {
    return `Overcast cloudy day (${tempC}°C)! Ideal weather for a peaceful walk or organizing your financial records in CashTrack.`;
  }

  if (conditionType === 'sunny') {
    return `Clear sunny day (${tempC}°C)! Take advantage of free park activities and outdoor leisure to keep your spending low.`;
  }

  if (conditionType === 'partly-sunny') {
    return `Pleasant weather today (${tempC}°C)! Walk or cycle for short local errands to save money on fuel and transit.`;
  }

  return `Mindful spending check (${tempC}°C) — keep your daily coffee, snack, and small expenses on budget today!`;
}

export function getWeatherBackgroundColor(conditionType: WeatherConditionType): string {
  switch (conditionType) {
    case 'sunny':
      return 'rgba(217, 119, 6, 0.48)';
    case 'clear-night':
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

/**
 * Default fallback weather when offline or location is unavailable.
 */
export const DEFAULT_WEATHER_DATA: WeatherData = {
  tempC: 22,
  tempMaxC: 25,
  tempMinC: 18,
  rainProbability: 10,
  humidity: 50,
  windSpeedKmH: 12,
  weatherCode: 0,
  condition: 'Sunny & Clear',
  conditionType: 'sunny',
  locationName: 'Local Weather',
  financialTip: getFinancialWeatherTip(22, 10, 'sunny', false),
  isNight: false,
};

/**
 * Fetches live weather data from Open-Meteo API with location reverse geocoding.
 */
export async function fetchLiveWeatherData(): Promise<WeatherData> {
  try {
    const Location = await import('expo-location');

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return DEFAULT_WEATHER_DATA;
    }

    const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const { latitude, longitude } = location.coords;

    // Fetch from Open-Meteo API with current_weather and hourly precipitation probability & humidity
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m,precipitation_probability,windspeed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`
    );

    const data = (await response.json()) as {
      current_weather?: { temperature: number; weathercode: number; windspeed: number; is_day: number; time: string };
      daily?: {
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
      hourly?: {
        time?: string[];
        precipitation_probability?: number[];
        relativehumidity_2m?: number[];
      };
    };

    if (!data.current_weather) {
      return DEFAULT_WEATHER_DATA;
    }

    const tempC = Math.round(data.current_weather.temperature);
    const weatherCode = data.current_weather.weathercode;
    const windSpeedKmH = Math.round(data.current_weather.windspeed || 12);
    const isNight = data.current_weather.is_day === 0;

    const tempMaxC = Math.round(data.daily?.temperature_2m_max?.[0] ?? tempC + 3);
    const tempMinC = Math.round(data.daily?.temperature_2m_min?.[0] ?? tempC - 4);

    // Calculate current hour rain probability accurately
    let rainProbability = 10;
    if (data.hourly?.time && data.hourly?.precipitation_probability) {
      const currentTimeStr = data.current_weather.time; // e.g. "2026-03-31T20:00"
      const hourIndex = data.hourly.time.findIndex((t) => t === currentTimeStr || t.startsWith(currentTimeStr.slice(0, 13)));
      if (hourIndex >= 0 && data.hourly.precipitation_probability[hourIndex] !== undefined) {
        rainProbability = Math.round(data.hourly.precipitation_probability[hourIndex]);
      } else {
        rainProbability = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 10);
      }
    } else {
      rainProbability = Math.round(data.daily?.precipitation_probability_max?.[0] ?? 10);
    }

    // Sanity check: If weather code is clear or partly cloudy (0, 1, 2, 3) and no rain code,
    // rain chance should not show false high values (e.g. 98%). Cap at 20% for clear/partly cloudy weather.
    if (weatherCode <= 3) {
      rainProbability = Math.min(rainProbability, 20);
    }

    const humidity = Math.round(data.hourly?.relativehumidity_2m?.[0] ?? 50);

    const condDetails = getWeatherConditionDetails(weatherCode, isNight);

    // Location geocoding
    let locationName = 'Local Weather';
    let cityFound = false;

    try {
      const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (reverseGeo && reverseGeo[0]) {
        const city = reverseGeo[0].city || reverseGeo[0].subregion || reverseGeo[0].region;
        if (city) {
          locationName = city;
          cityFound = true;
        }
      }
    } catch {}

    if (!cityFound) {
      try {
        const geoRes = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        const geoData = (await geoRes.json()) as { city?: string; locality?: string; principalSubdivision?: string };
        const city = geoData.city || geoData.locality || geoData.principalSubdivision;
        if (city) locationName = city;
      } catch {}
    }

    const financialTip = getFinancialWeatherTip(tempC, rainProbability, condDetails.type, isNight);

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
      financialTip,
      isNight,
    };
  } catch {
    return DEFAULT_WEATHER_DATA;
  }
}
