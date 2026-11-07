import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { getCityPhoto } from '@/constants/city-photos';
import { deviceTimeZone, placeFromAddress, placeFromZone, type LocalPlace } from '@/utils/local-place';
import { fetchPlacePhoto } from '@/utils/place-photo';

type LocateStatus = 'idle' | 'locating' | 'denied' | 'failed';

export type LocalPlaceState = {
  place: LocalPlace;
  zone: string;
  /** Landmark photo for the place, or null to show the sky instead. */
  photoUri: string | null;
  status: LocateStatus;
  /** Reverse geocoding only exists on phones. */
  canLocate: boolean;
  /** Ask for location (shows the system prompt the first time) and refine the place. */
  locate: () => void;
};

const CAN_LOCATE = Platform.OS === 'ios' || Platform.OS === 'android';

type LocateResult = { status: LocateStatus; place: LocalPlace | null };

/**
 * The phone's area from its location. Only shows the permission prompt when
 * `ask` is true (a tap); otherwise it uses an existing grant or gives up.
 */
async function locatePlace(ask: boolean): Promise<LocateResult> {
  if (!CAN_LOCATE) return { status: 'idle', place: null };
  try {
    const Location = await import('expo-location');
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted' && ask) {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    }
    if (status !== 'granted') return { status: ask ? 'denied' : 'idle', place: null };

    // A recent fix is plenty for a city name and much faster than a new one.
    const position =
      (await Location.getLastKnownPositionAsync({ maxAge: 30 * 60_000 })) ??
      (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    const [address] = await Location.reverseGeocodeAsync(position.coords);
    const place = address ? placeFromAddress(address) : null;
    return { status: place ? 'idle' : 'failed', place };
  } catch {
    return { status: 'failed', place: null };
  }
}

/**
 * The device's place for the World Clocks "Your time" card. Starts from the
 * time zone, which needs no permission. If location is already allowed (for
 * weather, say) it quietly refines to the real area; it only shows the
 * permission prompt when the person taps the button. Nothing is stored.
 */
export function useLocalPlace(): LocalPlaceState {
  const [zone] = useState(deviceTimeZone);
  const [located, setLocated] = useState<LocalPlace | null>(null);
  const [status, setStatus] = useState<LocateStatus>('idle');
  const [lookedUpPhoto, setLookedUpPhoto] = useState<{ query: string; uri: string | null } | null>(null);

  const place = located ?? placeFromZone(zone);

  const apply = (result: LocateResult) => {
    setStatus(result.status);
    if (result.place) setLocated(result.place);
  };

  // Quiet refine on open, only if location is already allowed.
  useEffect(() => {
    let cancelled = false;
    locatePlace(false).then((result) => {
      if (!cancelled) apply(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const locate = () => {
    setStatus('locating');
    void locatePlace(true).then(apply);
  };

  const curated = place.cityId ? getCityPhoto(place.cityId) : null;
  const query = curated ? null : place.photoQuery;

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    fetchPlacePhoto(query).then((uri) => {
      if (!cancelled) setLookedUpPhoto({ query, uri });
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const photoUri = curated?.uri ?? (query && lookedUpPhoto?.query === query ? lookedUpPhoto.uri : null);

  return { place, zone, photoUri, status, canLocate: CAN_LOCATE, locate };
}
