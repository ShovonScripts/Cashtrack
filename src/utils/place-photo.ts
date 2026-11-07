/**
 * Lead photo of a place's Wikipedia article, for places that are not in the
 * curated World Clocks list. Sends only the place name to Wikipedia.
 */
import { CITY_PHOTO_HEADERS } from '../constants/city-photos.ts';

/** Images that are maps, flags or emblems, not photos of the place. */
const NOT_A_PHOTO = /\.svg|locator|location|map|flag|coat_of_arms|seal|emblem|logo/i;

export function placePhotoUrl(name: string): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '960',
    redirects: '1',
    origin: '*',
    titles: name,
  });
  return `https://en.wikipedia.org/w/api.php?${params.toString()}`;
}

/** The photo URL from a `pageimages` response, or null when there is none or it is not a photo. */
export function parsePlacePhoto(json: unknown): string | null {
  const pages = (json as { query?: { pages?: { thumbnail?: { source?: string } }[] } })?.query?.pages;
  const source = pages?.[0]?.thumbnail?.source;
  if (!source || NOT_A_PHOTO.test(source)) return null;
  return source;
}

const cache = new Map<string, string | null>();

/** Photo for a place name, cached for the session. Never throws. */
export async function fetchPlacePhoto(name: string): Promise<string | null> {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(placePhotoUrl(name.trim()), { headers: CITY_PHOTO_HEADERS, signal: controller.signal });
    const url = response.ok ? parsePlacePhoto(await response.json()) : null;
    cache.set(key, url);
    return url;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
