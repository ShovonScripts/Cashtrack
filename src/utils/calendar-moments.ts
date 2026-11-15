/**
 * Calendar "moments" are gentle, self-contained nudges tied to dates in the
 * year: the first and last day of each month, and the year's start, final week
 * and final day. All copy is derived from the moment's own date, never from
 * "now", so a notification scheduled weeks ahead still reads true when it
 * arrives.
 */

export type CalendarMomentKind =
  | 'month-start'
  | 'month-end'
  | 'year-start'
  | 'year-countdown'
  | 'year-final';

export type CalendarMoment = {
  /** Stable identifier, e.g. `calendar-moment-month-start-2026-02-01`. */
  id: string;
  kind: CalendarMomentKind;
  /** Local time the moment fires. */
  date: Date;
  title: string;
  body: string;
};

export type CalendarMomentOptions = {
  /** Only moments this many days ahead are returned. Defaults to 400. */
  horizonDays?: number;
  /** Maximum number of moments returned. Defaults to 8. */
  limit?: number;
};

const MS_PER_DAY = 86_400_000;
const MONTH_NAME = new Intl.DateTimeFormat('en', { month: 'long' });

const MONTH_START_HOUR = 9;
const MONTH_END_HOUR = 20;
const YEAR_START_HOUR = 9;
const YEAR_COUNTDOWN_HOUR = 9;
const YEAR_FINAL_HOUR = 20;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function at(year: number, monthIndex: number, day: number, hour: number): Date {
  return new Date(year, monthIndex, day, hour, 0, 0, 0);
}

function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function daysBetween(from: Date, to: Date): number {
  const fromDay = Math.floor(Date.UTC(from.getFullYear(), from.getMonth(), from.getDate()) / MS_PER_DAY);
  const toDay = Math.floor(Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) / MS_PER_DAY);
  return toDay - fromDay;
}

function buildMoment(kind: CalendarMomentKind, date: Date): CalendarMoment {
  const year = date.getFullYear();
  const monthName = MONTH_NAME.format(date);

  let title: string;
  let body: string;

  switch (kind) {
    case 'month-start':
      title = 'New month, fresh start';
      body = `${monthName} begins. Plan your limits in CashTrack.`;
      break;
    case 'month-end':
      title = 'Month wrap-up';
      body = `Last day of ${monthName}. Log anything left and review your spending.`;
      break;
    case 'year-start':
      title = 'Happy new year';
      body = `Set your money goals for ${year}.`;
      break;
    case 'year-countdown': {
      const daysLeft = daysBetween(date, at(year, 11, 31, 0));
      title = `${daysLeft} days left in ${year}`;
      body = 'About a week left. A good moment to reflect on the year.';
      break;
    }
    case 'year-final':
      title = `Last day of ${year}`;
      body = "Finish the year strong. Review your spending and set next year's goals.";
      break;
  }

  return { id: `calendar-moment-${kind}-${dateKey(date)}`, kind, date, title, body };
}

/**
 * Month moments across the coming months. January's start is covered by the
 * year-start moment, and December's end by the year-final moment, so those two
 * are skipped here to avoid two notifications landing at once.
 */
function monthlyCandidates(now: Date): CalendarMoment[] {
  const result: CalendarMoment[] = [];
  const startYear = now.getFullYear();
  const startMonth = now.getMonth();

  for (let offset = 0; offset <= 14; offset += 1) {
    const anchor = new Date(startYear, startMonth + offset, 1);
    const year = anchor.getFullYear();
    const monthIndex = anchor.getMonth();

    if (monthIndex !== 0) {
      result.push(buildMoment('month-start', at(year, monthIndex, 1, MONTH_START_HOUR)));
    }
    if (monthIndex !== 11) {
      const day = lastDayOfMonth(year, monthIndex);
      result.push(buildMoment('month-end', at(year, monthIndex, day, MONTH_END_HOUR)));
    }
  }

  return result;
}

function yearlyCandidates(now: Date): CalendarMoment[] {
  const result: CalendarMoment[] = [];
  const year = now.getFullYear();

  for (let y = year - 1; y <= year + 2; y += 1) {
    result.push(buildMoment('year-start', at(y, 0, 1, YEAR_START_HOUR)));
    result.push(buildMoment('year-countdown', at(y, 11, 26, YEAR_COUNTDOWN_HOUR)));
    result.push(buildMoment('year-final', at(y, 11, 31, YEAR_FINAL_HOUR)));
  }

  return result;
}

/**
 * The next calendar moments after `now`, soonest first. Pure and deterministic
 * for the given `now`, so it can be reused by the scheduler, the settings
 * preview and the tests.
 */
export function getUpcomingCalendarMoments(
  now: Date = new Date(),
  options: CalendarMomentOptions = {}
): CalendarMoment[] {
  const horizonDays = options.horizonDays ?? 400;
  const limit = options.limit ?? 8;
  const nowTime = now.getTime();
  const horizonTime = nowTime + horizonDays * MS_PER_DAY;

  const seen = new Set<string>();
  return [...monthlyCandidates(now), ...yearlyCandidates(now)]
    .filter((moment) => moment.date.getTime() > nowTime && moment.date.getTime() <= horizonTime)
    .filter((moment) => {
      if (seen.has(moment.id)) return false;
      seen.add(moment.id);
      return true;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}
