/** Pure helpers for the stopwatch + quick alarm feature. No React, no native modules. */

export type Lap = {
  id: string;
  /** 1-based position in the run. */
  index: number;
  /** Total elapsed time at the moment the lap was taken. */
  totalMs: number;
  /** Time since the previous lap (or since the start for the first lap). */
  splitMs: number;
  /** Set for markers added automatically, such as a finished timer. */
  label?: string;
};

export type QuickAlarm = {
  id: string;
  label: string;
  durationMs: number;
  /** Epoch ms at which the alarm rings. */
  endAt: number;
};

export type SavedTimer = {
  id: string;
  label: string;
  durationMs: number;
};

export const QUICK_ALARM_MINUTES = [1, 5, 10, 15, 30] as const;
export const MAX_ACTIVE_ALARMS = 5;
export const MAX_SAVED_TIMERS = 8;
export const MAX_TIMER_MS = 24 * 60 * 60 * 1000 - 1000;
export const SNOOZE_MS = 5 * 60 * 1000;
/** A timer that ended longer ago than this is not rung again when the app opens. */
export const RING_WINDOW_MS = 60 * 1000;

/** Notification identifiers for quick alarms start with this prefix. */
export const QUICK_ALARM_ID_PREFIX = 'quick-alarm:';

const pad = (n: number, width = 2) => String(n).padStart(width, '0');

/** HH:MM:SS for whole seconds. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  return `${pad(hrs)}:${pad(mins)}:${pad(safe % 60)}`;
}

/** MM:SS.cc for lap rows. Minutes are not capped, so 61 minutes shows 61:00.00. */
export function formatLap(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const mins = Math.floor(safe / 60000);
  const secs = Math.floor((safe % 60000) / 1000);
  const centis = Math.floor((safe % 1000) / 10);
  return `${pad(mins)}:${pad(secs)}.${pad(centis)}`;
}

/** Countdown text: MM:SS, or H:MM:SS from one hour up. Rounds up so 0:00 means done. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}

/** Short human label: "45 sec", "5 min", "1 hr 30 min", "2 min 30 sec". */
export function formatDurationLabel(ms: number): string {
  const totalSeconds = Math.max(0, Math.round(ms / 1000));
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts: string[] = [];
  if (hrs) parts.push(`${hrs} hr`);
  if (mins) parts.push(`${mins} min`);
  if (secs || parts.length === 0) parts.push(`${secs} sec`);
  return parts.join(' ');
}

function toWholeNumber(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  if (!/^\d{1,3}$/.test(trimmed)) return null;
  return Number(trimmed);
}

/**
 * Turns the hours / minutes / seconds the user typed into milliseconds.
 * Blank fields count as 0. Returns null when the result is empty, invalid,
 * or longer than 24 hours.
 */
export function parseDuration(hours: string, minutes: string, seconds: string): number | null {
  const h = toWholeNumber(hours);
  const m = toWholeNumber(minutes);
  const s = toWholeNumber(seconds);
  if (h === null || m === null || s === null) return null;
  const total = ((h * 60 + m) * 60 + s) * 1000;
  if (total <= 0 || total > MAX_TIMER_MS) return null;
  return total;
}

/** Milliseconds the stopwatch has counted at `now`. */
export function elapsedMs(state: { running: boolean; baseMs: number; startedAt: number }, now: number): number {
  if (!state.running) return state.baseMs;
  return state.baseMs + Math.max(0, now - state.startedAt);
}

/** Builds the next lap (laps are stored newest first). */
export function makeLap(existing: readonly Lap[], totalMs: number, label?: string): Lap {
  // Labelled markers (a finished timer) are not laps: they never shift the
  // numbering or the split of the next real lap.
  const timed = existing.filter((lap) => !lap.label);
  if (label) {
    return { id: `mark-${existing.length}-${Math.floor(totalMs)}`, index: timed.length, totalMs, splitMs: 0, label };
  }
  const previousTotal = timed[0]?.totalMs ?? 0;
  const index = timed.length + 1;
  return {
    id: `lap-${index}-${Math.floor(totalMs)}`,
    index,
    totalMs,
    splitMs: Math.max(0, totalMs - previousTotal),
  };
}

/**
 * Fastest and slowest split among timed laps (needs at least three, otherwise
 * highlighting means nothing). Markers added for timers are ignored.
 */
export function lapExtremes(laps: readonly Lap[]): { bestId: string | null; worstId: string | null } {
  const timed = laps.filter((lap) => !lap.label);
  if (timed.length < 3) return { bestId: null, worstId: null };
  let best = timed[0];
  let worst = timed[0];
  for (const lap of timed) {
    if (lap.splitMs < best.splitMs) best = lap;
    if (lap.splitMs > worst.splitMs) worst = lap;
  }
  if (best.splitMs === worst.splitMs) return { bestId: null, worstId: null };
  return { bestId: best.id, worstId: worst.id };
}

/** Separates alarms that have rung from those still counting down. */
export function splitAlarms(
  alarms: readonly QuickAlarm[],
  now: number,
): { active: QuickAlarm[]; expired: QuickAlarm[] } {
  const active: QuickAlarm[] = [];
  const expired: QuickAlarm[] = [];
  for (const alarm of alarms) {
    (alarm.endAt <= now ? expired : active).push(alarm);
  }
  active.sort((a, b) => a.endAt - b.endAt);
  expired.sort((a, b) => a.endAt - b.endAt);
  return { active, expired };
}

export function defaultAlarmLabel(durationMs: number): string {
  return formatDurationLabel(durationMs);
}

/** Adds a saved timer, replacing one with the same label and length. Newest first, capped. */
export function addSavedTimer(list: readonly SavedTimer[], timer: SavedTimer): SavedTimer[] {
  const rest = list.filter((item) => !(item.durationMs === timer.durationMs && item.label === timer.label));
  return [timer, ...rest].slice(0, MAX_SAVED_TIMERS);
}

/* ---------- Storage validation (never trust persisted JSON) ---------- */

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export type StoredStopwatch = { running: boolean; baseMs: number; startedAt: number; laps: Lap[] };

export function parseStoredStopwatch(raw: string | null): StoredStopwatch | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredStopwatch> | null;
    if (!value || typeof value !== 'object') return null;
    if (typeof value.running !== 'boolean' || !isFiniteNumber(value.baseMs) || !isFiniteNumber(value.startedAt)) {
      return null;
    }
    const laps = Array.isArray(value.laps)
      ? value.laps.filter(
          (lap): lap is Lap =>
            !!lap &&
            typeof lap.id === 'string' &&
            isFiniteNumber(lap.index) &&
            isFiniteNumber(lap.totalMs) &&
            isFiniteNumber(lap.splitMs),
        )
      : [];
    return { running: value.running, baseMs: Math.max(0, value.baseMs), startedAt: value.startedAt, laps };
  } catch {
    return null;
  }
}

export type StoredAlarms = { active: QuickAlarm[]; saved: SavedTimer[]; syncStopwatch: boolean };

export function parseStoredAlarms(raw: string | null): StoredAlarms | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<StoredAlarms> | null;
    if (!value || typeof value !== 'object') return null;
    const active = Array.isArray(value.active)
      ? value.active.filter(
          (a): a is QuickAlarm =>
            !!a &&
            typeof a.id === 'string' &&
            typeof a.label === 'string' &&
            isFiniteNumber(a.durationMs) &&
            isFiniteNumber(a.endAt),
        )
      : [];
    const saved = Array.isArray(value.saved)
      ? value.saved.filter(
          (t): t is SavedTimer =>
            !!t && typeof t.id === 'string' && typeof t.label === 'string' && isFiniteNumber(t.durationMs),
        )
      : [];
    return { active, saved: saved.slice(0, MAX_SAVED_TIMERS), syncStopwatch: value.syncStopwatch === true };
  } catch {
    return null;
  }
}
