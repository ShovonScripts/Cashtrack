/** Pure helpers for the World Clocks page. No React, no native modules. */

export type TimeDifference = {
  /** Minutes the city is ahead of the device (negative when behind). */
  minutes: number;
  /** "Same time", "5h 30m ahead", "3h behind". */
  label: string;
  /** Short badge text: "+5:30", "-3:00", "Same". */
  badge: string;
  /** Which calendar day it is in the city compared with the device. */
  dayLabel: 'Today' | 'Tomorrow' | 'Yesterday';
  direction: 'ahead' | 'behind' | 'same';
};

/** The zone's wall-clock reading as a UTC-based timestamp (year..second, no zone). */
function wallClockMs(timeZone: string | undefined, date: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || undefined,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).formatToParts(date);
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const result = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour') % 24, value('minute'), value('second'));
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

/**
 * How far `timeZone` is ahead of (or behind) the device clock right now.
 * Handles half-hour and 45-minute zones and daylight saving, because it reads
 * the real wall clock of both places instead of rounding hour differences.
 * `timeZone` empty/undefined means the device's own zone.
 */
export function getTimeDifference(timeZone: string | undefined, date: Date): TimeDifference | null {
  const city = wallClockMs(timeZone, date);
  const local = wallClockMs(undefined, date);
  if (city === null || local === null) return null;

  const minutes = Math.round((city - local) / 60000);
  const dayDiff = Math.floor(city / 86_400_000) - Math.floor(local / 86_400_000);
  const dayLabel = dayDiff > 0 ? 'Tomorrow' : dayDiff < 0 ? 'Yesterday' : 'Today';

  if (minutes === 0) {
    return { minutes, label: 'Same time', badge: 'Same', dayLabel, direction: 'same' };
  }
  const abs = Math.abs(minutes);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const direction = minutes > 0 ? 'ahead' : 'behind';
  const text = m === 0 ? `${h}h` : h === 0 ? `${m}m` : `${h}h ${m}m`;
  return {
    minutes,
    label: `${text} ${direction}`,
    badge: `${minutes > 0 ? '+' : '-'}${h}:${String(m).padStart(2, '0')}`,
    dayLabel,
    direction,
  };
}
