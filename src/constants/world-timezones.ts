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
  { id: 'la', cityName: 'Los Angeles', countryName: 'United States', timeZone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'chicago', cityName: 'Chicago', countryName: 'United States', timeZone: 'America/Chicago', flag: '🇺🇸' },
  { id: 'houston', cityName: 'Houston', countryName: 'United States', timeZone: 'America/Chicago', flag: '🇺🇸' },
  { id: 'phoenix', cityName: 'Phoenix', countryName: 'United States', timeZone: 'America/Phoenix', flag: '🇺🇸' },
  { id: 'philadelphia', cityName: 'Philadelphia', countryName: 'United States', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'san_francisco', cityName: 'San Francisco', countryName: 'United States', timeZone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'seattle', cityName: 'Seattle', countryName: 'United States', timeZone: 'America/Los_Angeles', flag: '🇺🇸' },
  { id: 'boston', cityName: 'Boston', countryName: 'United States', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'miami', cityName: 'Miami', countryName: 'United States', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'denver', cityName: 'Denver', countryName: 'United States', timeZone: 'America/Denver', flag: '🇺🇸' },
  { id: 'atlanta', cityName: 'Atlanta', countryName: 'United States', timeZone: 'America/New_York', flag: '🇺🇸' },
  { id: 'toronto', cityName: 'Toronto', countryName: 'Canada', timeZone: 'America/Toronto', flag: '🇨🇦' },
  { id: 'vancouver', cityName: 'Vancouver', countryName: 'Canada', timeZone: 'America/Vancouver', flag: '🇨🇦' },
  { id: 'montreal', cityName: 'Montreal', countryName: 'Canada', timeZone: 'America/Toronto', flag: '🇨🇦' },
  { id: 'calgary', cityName: 'Calgary', countryName: 'Canada', timeZone: 'America/Edmonton', flag: '🇨🇦' },
  { id: 'mexico_city', cityName: 'Mexico City', countryName: 'Mexico', timeZone: 'America/Mexico_City', flag: '🇲🇽' },
  { id: 'guadalajara', cityName: 'Guadalajara', countryName: 'Mexico', timeZone: 'America/Mexico_City', flag: '🇲🇽' },
  { id: 'sao_paulo', cityName: 'São Paulo', countryName: 'Brazil', timeZone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { id: 'rio', cityName: 'Rio de Janeiro', countryName: 'Brazil', timeZone: 'America/Sao_Paulo', flag: '🇧🇷' },
  { id: 'buenos_aires', cityName: 'Buenos Aires', countryName: 'Argentina', timeZone: 'America/Argentina/Buenos_Aires', flag: '🇦🇷' },
  { id: 'santiago', cityName: 'Santiago', countryName: 'Chile', timeZone: 'America/Santiago', flag: '🇨🇱' },
  { id: 'bogota', cityName: 'Bogotá', countryName: 'Colombia', timeZone: 'America/Bogota', flag: '🇨🇴' },
  { id: 'lima', cityName: 'Lima', countryName: 'Peru', timeZone: 'America/Lima', flag: '🇵🇪' },
  { id: 'caracas', cityName: 'Caracas', countryName: 'Venezuela', timeZone: 'America/Caracas', flag: '🇻🇪' },
  { id: 'london', cityName: 'London', countryName: 'United Kingdom', timeZone: 'Europe/London', flag: '🇬🇧' },
  { id: 'manchester', cityName: 'Manchester', countryName: 'United Kingdom', timeZone: 'Europe/London', flag: '🇬🇧' },
  { id: 'edinburgh', cityName: 'Edinburgh', countryName: 'United Kingdom', timeZone: 'Europe/London', flag: '🇬🇧' },
  { id: 'dublin', cityName: 'Dublin', countryName: 'Ireland', timeZone: 'Europe/Dublin', flag: '🇮🇪' },
  { id: 'paris', cityName: 'Paris', countryName: 'France', timeZone: 'Europe/Paris', flag: '🇫🇷' },
  { id: 'berlin', cityName: 'Berlin', countryName: 'Germany', timeZone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'munich', cityName: 'Munich', countryName: 'Germany', timeZone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'frankfurt', cityName: 'Frankfurt', countryName: 'Germany', timeZone: 'Europe/Berlin', flag: '🇩🇪' },
  { id: 'rome', cityName: 'Rome', countryName: 'Italy', timeZone: 'Europe/Rome', flag: '🇮🇹' },
  { id: 'milan', cityName: 'Milan', countryName: 'Italy', timeZone: 'Europe/Rome', flag: '🇮🇹' },
  { id: 'madrid', cityName: 'Madrid', countryName: 'Spain', timeZone: 'Europe/Madrid', flag: '🇪🇸' },
  { id: 'barcelona', cityName: 'Barcelona', countryName: 'Spain', timeZone: 'Europe/Madrid', flag: '🇪🇸' },
  { id: 'amsterdam', cityName: 'Amsterdam', countryName: 'Netherlands', timeZone: 'Europe/Amsterdam', flag: '🇳🇱' },
  { id: 'brussels', cityName: 'Brussels', countryName: 'Belgium', timeZone: 'Europe/Brussels', flag: '🇧🇪' },
  { id: 'zurich', cityName: 'Zurich', countryName: 'Switzerland', timeZone: 'Europe/Zurich', flag: '🇨🇭' },
  { id: 'geneva', cityName: 'Geneva', countryName: 'Switzerland', timeZone: 'Europe/Zurich', flag: '🇨🇭' },
  { id: 'vienna', cityName: 'Vienna', countryName: 'Austria', timeZone: 'Europe/Vienna', flag: '🇦🇹' },
  { id: 'stockholm', cityName: 'Stockholm', countryName: 'Sweden', timeZone: 'Europe/Stockholm', flag: '🇸🇪' },
  { id: 'oslo', cityName: 'Oslo', countryName: 'Norway', timeZone: 'Europe/Oslo', flag: '🇳🇴' },
  { id: 'copenhagen', cityName: 'Copenhagen', countryName: 'Denmark', timeZone: 'Europe/Copenhagen', flag: '🇩🇰' },
  { id: 'helsinki', cityName: 'Helsinki', countryName: 'Finland', timeZone: 'Europe/Helsinki', flag: '🇫🇮' },
  { id: 'warsaw', cityName: 'Warsaw', countryName: 'Poland', timeZone: 'Europe/Warsaw', flag: '🇵🇱' },
  { id: 'prague', cityName: 'Prague', countryName: 'Czech Republic', timeZone: 'Europe/Prague', flag: '🇨🇿' },
  { id: 'budapest', cityName: 'Budapest', countryName: 'Hungary', timeZone: 'Europe/Budapest', flag: '🇭🇺' },
  { id: 'athens', cityName: 'Athens', countryName: 'Greece', timeZone: 'Europe/Athens', flag: '🇬🇷' },
  { id: 'lisbon', cityName: 'Lisbon', countryName: 'Portugal', timeZone: 'Europe/Lisbon', flag: '🇵🇹' },
  { id: 'reykjavik', cityName: 'Reykjavik', countryName: 'Iceland', timeZone: 'Atlantic/Reykjavik', flag: '🇮🇸' },
  { id: 'dubrovnik', cityName: 'Dubrovnik', countryName: 'Croatia', timeZone: 'Europe/Zagreb', flag: '🇭🇷' },
  { id: 'istanbul', cityName: 'Istanbul', countryName: 'Turkey', timeZone: 'Europe/Istanbul', flag: '🇹🇷' },
  { id: 'moscow', cityName: 'Moscow', countryName: 'Russia', timeZone: 'Europe/Moscow', flag: '🇷🇺' },
  { id: 'saint_petersburg', cityName: 'Saint Petersburg', countryName: 'Russia', timeZone: 'Europe/Moscow', flag: '🇷🇺' },
  { id: 'kiev', cityName: 'Kyiv', countryName: 'Ukraine', timeZone: 'Europe/Kyiv', flag: '🇺🇦' },
  { id: 'tokyo', cityName: 'Tokyo', countryName: 'Japan', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'osaka', cityName: 'Osaka', countryName: 'Japan', timeZone: 'Asia/Tokyo', flag: '🇯🇵' },
  { id: 'beijing', cityName: 'Beijing', countryName: 'China', timeZone: 'Asia/Shanghai', flag: '🇨🇳' },
  { id: 'shanghai', cityName: 'Shanghai', countryName: 'China', timeZone: 'Asia/Shanghai', flag: '🇨🇳' },
  { id: 'hong_kong', cityName: 'Hong Kong', countryName: 'Hong Kong', timeZone: 'Asia/Hong_Kong', flag: '🇭🇰' },
  { id: 'taipei', cityName: 'Taipei', countryName: 'Taiwan', timeZone: 'Asia/Taipei', flag: '🇹🇼' },
  { id: 'seoul', cityName: 'Seoul', countryName: 'South Korea', timeZone: 'Asia/Seoul', flag: '🇰🇷' },
  { id: 'singapore', cityName: 'Singapore', countryName: 'Singapore', timeZone: 'Asia/Singapore', flag: '🇸🇬' },
  { id: 'bangkok', cityName: 'Bangkok', countryName: 'Thailand', timeZone: 'Asia/Bangkok', flag: '🇹🇭' },
  { id: 'kuala_lumpur', cityName: 'Kuala Lumpur', countryName: 'Malaysia', timeZone: 'Asia/Kuala_Lumpur', flag: '🇲🇾' },
  { id: 'jakarta', cityName: 'Jakarta', countryName: 'Indonesia', timeZone: 'Asia/Jakarta', flag: '🇮🇩' },
  { id: 'manila', cityName: 'Manila', countryName: 'Philippines', timeZone: 'Asia/Manila', flag: '🇵🇭' },
  { id: 'hanoi', cityName: 'Hanoi', countryName: 'Vietnam', timeZone: 'Asia/Bangkok', flag: '🇻🇳' },
  { id: 'ho_chi_minh', cityName: 'Ho Chi Minh City', countryName: 'Vietnam', timeZone: 'Asia/Ho_Chi_Minh', flag: '🇻🇳' },
  { id: 'dhaka', cityName: 'Dhaka', countryName: 'Bangladesh', timeZone: 'Asia/Dhaka', flag: '🇧🇩' },
  { id: 'delhi', cityName: 'New Delhi', countryName: 'India', timeZone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'mumbai', cityName: 'Mumbai', countryName: 'India', timeZone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'bangalore', cityName: 'Bangalore', countryName: 'India', timeZone: 'Asia/Kolkata', flag: '🇮🇳' },
  { id: 'karachi', cityName: 'Karachi', countryName: 'Pakistan', timeZone: 'Asia/Karachi', flag: '🇵🇰' },
  { id: 'lahore', cityName: 'Lahore', countryName: 'Pakistan', timeZone: 'Asia/Karachi', flag: '🇵🇰' },
  { id: 'colombo', cityName: 'Colombo', countryName: 'Sri Lanka', timeZone: 'Asia/Colombo', flag: '🇱🇰' },
  { id: 'kathmandu', cityName: 'Kathmandu', countryName: 'Nepal', timeZone: 'Asia/Kathmandu', flag: '🇳🇵' },
  { id: 'dubai', cityName: 'Dubai', countryName: 'United Arab Emirates', timeZone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'abu_dhabi', cityName: 'Abu Dhabi', countryName: 'United Arab Emirates', timeZone: 'Asia/Dubai', flag: '🇦🇪' },
  { id: 'doha', cityName: 'Doha', countryName: 'Qatar', timeZone: 'Asia/Qatar', flag: '🇶🇦' },
  { id: 'riyadh', cityName: 'Riyadh', countryName: 'Saudi Arabia', timeZone: 'Asia/Riyadh', flag: '🇸🇦' },
  { id: 'jeddah', cityName: 'Jeddah', countryName: 'Saudi Arabia', timeZone: 'Asia/Riyadh', flag: '🇸🇦' },
  { id: 'kuwait_city', cityName: 'Kuwait City', countryName: 'Kuwait', timeZone: 'Asia/Kuwait', flag: '🇰🇼' },
  { id: 'muscat', cityName: 'Muscat', countryName: 'Muscat', timeZone: 'Asia/Muscat', flag: '🇴🇲' },
  { id: 'manama', cityName: 'Manama', countryName: 'Bahrain', timeZone: 'Asia/Bahrain', flag: '🇧🇭' },
  { id: 'tehran', cityName: 'Tehran', countryName: 'Iran', timeZone: 'Asia/Tehran', flag: '🇮🇷' },
  { id: 'tel_aviv', cityName: 'Tel Aviv', countryName: 'Israel', timeZone: 'Asia/Jerusalem', flag: '🇮🇱' },
  { id: 'cairo', cityName: 'Cairo', countryName: 'Egypt', timeZone: 'Africa/Cairo', flag: '🇪🇬' },
  { id: 'johannesburg', cityName: 'Johannesburg', countryName: 'South Africa', timeZone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { id: 'cape_town', cityName: 'Cape Town', countryName: 'South Africa', timeZone: 'Africa/Johannesburg', flag: '🇿🇦' },
  { id: 'lagos', cityName: 'Lagos', countryName: 'Nigeria', timeZone: 'Africa/Lagos', flag: '🇳🇬' },
  { id: 'nairobi', cityName: 'Nairobi', countryName: 'Kenya', timeZone: 'Africa/Nairobi', flag: '🇰🇪' },
  { id: 'casablanca', cityName: 'Casablanca', countryName: 'Morocco', timeZone: 'Africa/Casablanca', flag: '🇲🇦' },
  { id: 'addis_ababa', cityName: 'Addis Ababa', countryName: 'Ethiopia', timeZone: 'Africa/Addis_Ababa', flag: '🇪🇹' },
  { id: 'accra', cityName: 'Accra', countryName: 'Ghana', timeZone: 'Africa/Accra', flag: '🇬🇭' },
  { id: 'sydney', cityName: 'Sydney', countryName: 'Australia', timeZone: 'Australia/Sydney', flag: '🇦🇺' },
  { id: 'melbourne', cityName: 'Melbourne', countryName: 'Australia', timeZone: 'Australia/Melbourne', flag: '🇦🇺' },
  { id: 'brisbane', cityName: 'Brisbane', countryName: 'Australia', timeZone: 'Australia/Brisbane', flag: '🇦🇺' },
  { id: 'perth', cityName: 'Perth', countryName: 'Australia', timeZone: 'Australia/Perth', flag: '🇦🇺' },
  { id: 'adelaide', cityName: 'Adelaide', countryName: 'Australia', timeZone: 'Australia/Adelaide', flag: '🇦🇺' },
  { id: 'auckland', cityName: 'Auckland', countryName: 'New Zealand', timeZone: 'Pacific/Auckland', flag: '🇳🇿' },
  { id: 'wellington', cityName: 'Wellington', countryName: 'New Zealand', timeZone: 'Pacific/Auckland', flag: '🇳🇿' },
  { id: 'fiji', cityName: 'Suva', countryName: 'Fiji', timeZone: 'Pacific/Fiji', flag: '🇫🇯' },
  { id: 'honolulu', cityName: 'Honolulu', countryName: 'United States', timeZone: 'Pacific/Honolulu', flag: '🇺🇸' },
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
