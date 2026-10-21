export type WorldCity = {
  id: string;
  cityName: string;
  countryName: string;
  timeZone: string; // IANA timezone e.g. 'America/New_York'
  flag: string;
};

export const WORLD_CITIES: WorldCity[] = [
  { id: 'local', cityName: 'Local Time', countryName: 'Current Location', timeZone: '', flag: '📍' },
  { id: 'nyc', cityName: 'New York', countryName: 'United States', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'london', cityName: 'London', countryName: 'United Kingdom', timeZone: 'Europe/London', flag: '🇬🇧' },
  { id: 'tokyo', cityName: 'Tokyo', countryName: 'Japan', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'dubai', cityName: 'Dubai', countryName: 'United Arab Emirates', timeZone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'dhaka', cityName: 'Dhaka', countryName: 'Bangladesh', timeZone: 'Asia/Dhaka', flag: '🇧🇩' },
  { id: 'delhi', cityName: 'New Delhi', countryName: 'India', timeZone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'sydney', cityName: 'Sydney', countryName: 'Australia', timeZone: 'Australia/Sydney', flag: '🇦🇺' },
  { id: 'paris', cityName: 'Paris', countryName: 'France', timeZone: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'singapore', cityName: 'Singapore', countryName: 'Singapore', timeZone: 'Asia/Singapore', flag: '🇸🇬' },
  { id: 'toronto', cityName: 'Toronto', countryName: 'Canada', timeZone: 'America/Toronto', flag: '🇨🇦' },
  { id: 'sao_paulo', cityName: 'São Paulo', countryName: 'Brazil', timeZone: 'America/Sao_Paulo', flag: '🇧🇷' },
];

export function getFormattedTimeForZone(
  timeZone?: string,
  now: Date = new Date()
): { timeStr: string; ampm: string; dateStr: string; offsetStr: string } {
  try {
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timeZone || undefined,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    };
    const timeFormatter = new Intl.DateTimeFormat([], options);
    const parts = timeFormatter.formatToParts(now);

    let hour = '12';
    let minute = '00';
    let second = '00';
    let ampm = 'AM';

    for (const part of parts) {
      if (part.type === 'hour') hour = part.value;
      if (part.type === 'minute') minute = part.value;
      if (part.type === 'second') second = part.value;
      if (part.type === 'dayPeriod') ampm = part.value.toUpperCase();
    }

    const timeStr = `${hour}:${minute}:${second}`;

    const dateFormatter = new Intl.DateTimeFormat([], {
      timeZone: timeZone || undefined,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const dateStr = dateFormatter.format(now);

    return { timeStr, ampm, dateStr, offsetStr: '' };
  } catch {
    return { timeStr: '12:00:00', ampm: 'PM', dateStr: 'Today', offsetStr: '' };
  }
}
