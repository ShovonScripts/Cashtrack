import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { fetchLiveWeatherData, type WeatherData, type WeatherResult } from '@/utils/weather';

/** A reading younger than this is reused instead of asking GPS and the network again. */
const FRESH_MS = 15 * 60_000;

export type WeatherStatus = 'loading' | WeatherResult['status'];

type Snapshot = {
  /** The last live reading, kept while offline so the screen can say how old it is. */
  data: WeatherData | null;
  status: WeatherStatus;
  refreshing: boolean;
};

let snapshot: Snapshot = { data: null, status: 'loading', refreshing: false };
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((listener) => listener());
}

function isFresh() {
  return snapshot.status === 'live' && snapshot.data !== null && Date.now() - snapshot.data.fetchedAt < FRESH_MS;
}

/**
 * Loads weather once for the whole app. `ask` (a tap or pull to refresh)
 * forces a new reading and may show the location prompt; automatic loads
 * reuse a fresh reading and never prompt.
 */
function load(ask: boolean): Promise<void> {
  if (!ask && isFresh()) return Promise.resolve();
  if (inflight && !ask) return inflight;

  set({ refreshing: true });
  const run = fetchLiveWeatherData({ requestPermission: ask }).then((result) => {
    if (result.status === 'live') set({ data: result.data, status: 'live', refreshing: false });
    else set({ status: result.status, refreshing: false });
  });
  const tracked: Promise<void> = run.finally(() => {
    if (inflight === tracked) inflight = null;
  });
  inflight = tracked;
  return tracked;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Shared live weather for Home and the Weather page. */
export function useWeather() {
  const state = useSyncExternalStore(subscribe, () => snapshot, () => snapshot);

  useEffect(() => {
    void load(false);
    // Coming back to the app after a while: refresh if the reading is stale.
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void load(false);
    });
    return () => sub.remove();
  }, []);

  return { ...state, refresh: () => load(true) };
}
