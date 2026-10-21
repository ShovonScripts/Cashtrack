import type { FirstDayOfWeek } from '@/types/preferences';

export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'night';

export type YearProgress = {
  year: number;
  isLeapYear: boolean;
  /** 1-based day of the year, e.g. 294 of 365. */
  dayOfYear: number;
  daysInYear: number;
  /** Full days left after today. */
  daysLeftInYear: number;
  /** Fraction of the current day already elapsed, 0..1. */
  dayProgress: number;
  /** 1-based week of the year. Week 1 is the week containing January 1. */
  weekOfYear: number;
  /** 52, 53 or 54 depending on the year and the chosen first day of the week. */
  totalWeeksInYear: number;
  /** Full weeks left after the current week. */
  weeksLeftInYear: number;
  /** First day of the current week (local midnight). */
  weekStart: Date;
  /** Last day of the current week (local midnight), inclusive. */
  weekEnd: Date;
  /** Days left after today in the current week. */
  daysLeftInWeek: number;
  /** Fraction of the current week already elapsed, 0..1. */
  weekProgress: number;
  /** 1-based month number, 1..12. */
  monthNumber: number;
  monthLabel: string;
  monthShortLabel: string;
  /** 1-based day of the month. */
  dayOfMonth: number;
  daysInMonth: number;
  daysLeftInMonth: number;
  /** Full months left after the current month, 0..11. */
  monthsLeftInYear: number;
  /** Fraction of the current month already elapsed, 0..1. */
  monthProgress: number;
  /** 1-based quarter, 1..4. */
  quarter: number;
  /** Fraction of the year elapsed including the current day, 0..1. */
  yearProgress: number;
  /** Whole percent elapsed, safe for display (never over 100). */
  yearPercent: number;
  greeting: GreetingPeriod;
  greetingLabel: string;
};

const MONTH_LABEL = new Intl.DateTimeFormat('en', { month: 'long' });
const MONTH_SHORT_LABEL = new Intl.DateTimeFormat('en', { month: 'short' });

const MS_PER_DAY = 86_400_000;

const GREETING_LABEL: Record<GreetingPeriod, string> = {
  morning: 'Good Morning',
  afternoon: 'Good Afternoon',
  evening: 'Good Evening',
  night: 'Good Night',
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return startOfDay(next);
}

/** Local calendar day as a UTC day number, so DST never shifts the count. */
function dayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / MS_PER_DAY);
}

export function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

export function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** 0 for the first day of the week (Monday or Sunday), up to 6. */
function weekdayOffset(date: Date, firstDayOfWeek: FirstDayOfWeek): number {
  const weekday = date.getDay();
  return firstDayOfWeek === 'sunday' ? weekday : (weekday + 6) % 7;
}

/** Week 1 is the week containing January 1, starting on the configured first day. */
export function getWeekOfYear(
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): { weekOfYear: number; totalWeeksInYear: number; weekStart: Date; weekEnd: Date; daysLeftInWeek: number; weekProgress: number } {
  const year = now.getFullYear();
  const today = startOfDay(now);
  const dayOfYear = dayNumber(now) - dayNumber(new Date(year, 0, 1)) + 1;
  const jan1Offset = weekdayOffset(new Date(year, 0, 1), firstDayOfWeek);
  const offset = weekdayOffset(today, firstDayOfWeek);
  const daysInYear = getDaysInYear(year);

  const weekOfYear = Math.floor((dayOfYear - 1 + jan1Offset) / 7) + 1;
  const totalWeeksInYear = Math.ceil((daysInYear + jan1Offset) / 7);
  const weekStart = addDays(today, -offset);

  return {
    weekOfYear,
    totalWeeksInYear,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    daysLeftInWeek: 6 - offset,
    weekProgress: (offset + 1) / 7,
  };
}

export function getGreeting(now: Date = new Date()): GreetingPeriod {
  const hour = now.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getGreetingLabel(greeting: GreetingPeriod): string {
  return GREETING_LABEL[greeting];
}

export function getYearProgress(
  now: Date = new Date(),
  firstDayOfWeek: FirstDayOfWeek = 'monday'
): YearProgress {
  const year = now.getFullYear();
  const today = startOfDay(now);
  const daysInYear = getDaysInYear(year);
  const dayOfYear = dayNumber(now) - dayNumber(new Date(year, 0, 1)) + 1;
  const daysLeftInYear = Math.max(0, daysInYear - dayOfYear);

  const secondsToday =
    now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const dayProgress = secondsToday / 86_400;

  const week = getWeekOfYear(now, firstDayOfWeek);

  const monthIndex = now.getMonth();
  const monthNumber = monthIndex + 1;
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysLeftInMonth = Math.max(0, daysInMonth - dayOfMonth);
  const monthsLeftInYear = 12 - monthNumber;
  const monthProgress = dayOfMonth / daysInMonth;

  const yearProgress = (dayOfYear - 1 + dayProgress) / daysInYear;
  const yearPercent = Math.min(100, Math.max(0, Math.floor(yearProgress * 100)));

  const greeting = getGreeting(now);

  return {
    year,
    isLeapYear: isLeapYear(year),
    dayOfYear,
    daysInYear,
    daysLeftInYear,
    dayProgress,
    weekOfYear: week.weekOfYear,
    totalWeeksInYear: week.totalWeeksInYear,
    weeksLeftInYear: Math.max(0, week.totalWeeksInYear - week.weekOfYear),
    weekStart: week.weekStart,
    weekEnd: week.weekEnd,
    daysLeftInWeek: week.daysLeftInWeek,
    weekProgress: week.weekProgress,
    monthNumber,
    monthLabel: MONTH_LABEL.format(today),
    monthShortLabel: MONTH_SHORT_LABEL.format(today),
    dayOfMonth,
    daysInMonth,
    daysLeftInMonth,
    monthsLeftInYear,
    monthProgress,
    quarter: Math.floor(monthIndex / 3) + 1,
    yearProgress,
    yearPercent,
    greeting,
    greetingLabel: GREETING_LABEL[greeting],
  };
}

export function formatWeeksLeft(weeks: number): string {
  if (weeks <= 0) return 'Last week';
  return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} left`;
}

export function formatDaysLeft(days: number): string {
  if (days <= 0) return 'Last day';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
}

export function formatMonthsLeft(months: number): string {
  if (months <= 0) return 'Last month';
  return `${months} ${months === 1 ? 'month' : 'months'} left`;
}
