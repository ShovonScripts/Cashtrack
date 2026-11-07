/**
 * Where the device is, for the "Your time" card on World Clocks. Pure helpers:
 * no React, no native modules, so they run under `node --test`.
 */
import { WORLD_CITIES, type WorldCity } from '../constants/world-timezones.ts';

export type LocalPlace = {
  /** Most specific name we have: a neighbourhood or district when located, else the city. */
  area: string;
  /** The wider place under the area, e.g. "Dhaka, Bangladesh". Empty when unknown. */
  region: string;
  flag: string;
  /** World Clocks city with a landmark photo, when the place matches one. */
  cityId: string | null;
  /** City name to look up a photo for when there is no `cityId`. */
  photoQuery: string | null;
  /** `zone`: guessed from the phone's time zone. `gps`: from the phone's location. */
  source: 'zone' | 'gps';
};

/** The device's IANA time zone, such as "Asia/Dhaka". Empty when unavailable. */
export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';
  } catch {
    return '';
  }
}

/** "America/Argentina/Buenos_Aires" -> "Buenos Aires". */
export function cityNameFromZone(zone: string): string {
  const last = zone.split('/').pop() ?? '';
  return last.replace(/_/g, ' ');
}

const fold = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/**
 * The World Clocks city for a zone. Several cities share a zone (New York,
 * Boston, Miami...), so prefer the one the zone is named after.
 */
export function cityForZone(zone: string, cities: WorldCity[] = WORLD_CITIES): WorldCity | null {
  if (!zone) return null;
  const inZone = cities.filter((c) => c.id !== 'local' && c.timeZone === zone);
  if (inZone.length === 0) return null;
  const named = fold(cityNameFromZone(zone));
  return inZone.find((c) => fold(c.cityName) === named) ?? inZone[0];
}

/** A World Clocks city by name (and country, when given), ignoring accents and case. */
export function cityByName(name: string, country?: string | null, cities: WorldCity[] = WORLD_CITIES): WorldCity | null {
  const target = fold(name);
  if (!target) return null;
  const sameName = cities.filter((c) => c.id !== 'local' && fold(c.cityName) === target);
  if (sameName.length === 0) return null;
  if (country) {
    const inCountry = sameName.find((c) => fold(c.countryName) === fold(country));
    if (inCountry) return inCountry;
  }
  return sameName[0];
}

/** "BD" -> "🇧🇩". Falls back to a pin for anything that is not two letters. */
export function flagFromCountryCode(code: string | null | undefined): string {
  if (!code || !/^[a-z]{2}$/i.test(code)) return '📍';
  const base = 0x1f1e6;
  const upper = code.toUpperCase();
  return String.fromCodePoint(base + upper.charCodeAt(0) - 65, base + upper.charCodeAt(1) - 65);
}

/** Place guessed from the time zone alone: needs no permission and works offline. */
export function placeFromZone(zone: string, cities: WorldCity[] = WORLD_CITIES): LocalPlace {
  const city = cityForZone(zone, cities);
  if (city) {
    return { area: city.cityName, region: city.countryName, flag: city.flag, cityId: city.id, photoQuery: null, source: 'zone' };
  }
  const name = zone ? cityNameFromZone(zone) : '';
  const continent = zone.includes('/') ? zone.split('/')[0].replace(/_/g, ' ') : '';
  return {
    area: name || 'Your time',
    region: continent,
    flag: '📍',
    cityId: null,
    photoQuery: name || null,
    source: 'zone',
  };
}

export type GeocodedAddress = {
  district?: string | null;
  city?: string | null;
  subregion?: string | null;
  region?: string | null;
  country?: string | null;
  isoCountryCode?: string | null;
};

/** Place from the phone's reverse geocoder. Returns null when the address has no usable name. */
export function placeFromAddress(address: GeocodedAddress, cities: WorldCity[] = WORLD_CITIES): LocalPlace | null {
  const city = address.city || address.subregion || address.region || '';
  const district = address.district && address.district !== city ? address.district : '';
  const area = district || city;
  if (!area) return null;

  const match = city ? cityByName(city, address.country, cities) : null;
  const region = [district ? city : '', address.country ?? ''].filter(Boolean).join(', ');

  return {
    area,
    region,
    flag: address.isoCountryCode ? flagFromCountryCode(address.isoCountryCode) : (match?.flag ?? '📍'),
    cityId: match?.id ?? null,
    photoQuery: match ? null : city || null,
    source: 'gps',
  };
}

/** "GMT+6", "GMT+5:30", "GMT-3", "GMT" for the device right now. */
export function utcOffsetLabel(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  if (minutes === 0) return 'GMT';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return `GMT${sign}${h}${m ? `:${String(m).padStart(2, '0')}` : ''}`;
}

export type DayPhase = 'night' | 'dawn' | 'day' | 'dusk';

/** Rough part of the day from the local hour, for the card's sky and icon. */
export function dayPhase(hour: number): DayPhase {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 17) return 'day';
  if (hour >= 17 && hour < 20) return 'dusk';
  return 'night';
}

/** Greeting that matches the phase, e.g. "Good evening". */
export function greetingFor(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}
