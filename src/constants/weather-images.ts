import type { WeatherConditionType } from '@/utils/weather';

/**
 * High-quality royalty-free real photography background images for each weather condition,
 * including night-time clear skies and day conditions.
 */
export const WEATHER_BACKGROUND_IMAGES: Record<WeatherConditionType, string> = {
  sunny:
    'https://images.unsplash.com/photo-1601297183305-6df142704ea2?q=80&w=1000&auto=format&fit=crop',
  'clear-night':
    'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1000&auto=format&fit=crop',
  'partly-sunny':
    'https://images.unsplash.com/photo-1534088568595-a066f410bcda?q=80&w=1000&auto=format&fit=crop',
  cloudy:
    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=1000&auto=format&fit=crop',
  rainy:
    'https://images.unsplash.com/photo-1519692933481-e162a57d6721?q=80&w=1000&auto=format&fit=crop',
  snow:
    'https://images.unsplash.com/photo-1483664852095-d6cc6870702d?q=80&w=1000&auto=format&fit=crop',
  thunderstorm:
    'https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=1000&auto=format&fit=crop',
};

/**
 * Returns the matching real background image URL for a given weather condition.
 */
export function getWeatherBackgroundImageUrl(conditionType: WeatherConditionType): string {
  return WEATHER_BACKGROUND_IMAGES[conditionType] || WEATHER_BACKGROUND_IMAGES.sunny;
}
