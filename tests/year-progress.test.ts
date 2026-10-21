import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatDaysLeft,
  formatMonthsLeft,
  formatWeeksLeft,
  getGreeting,
  getGreetingLabel,
  getWeekOfYear,
  getYearProgress,
  isLeapYear,
} from '../src/utils/year-progress.ts';

function localDate(year: number, monthIndex: number, day: number, hour = 12): Date {
  return new Date(year, monthIndex, day, hour, 0, 0);
}

test('January 1 is week 1 with Monday as the first day', () => {
  const progress = getYearProgress(localDate(2026, 0, 1), 'monday');

  assert.equal(progress.dayOfYear, 1);
  assert.equal(progress.daysInYear, 365);
  assert.equal(progress.daysLeftInYear, 364);
  assert.equal(progress.weekOfYear, 1);
  assert.equal(progress.totalWeeksInYear, 53);
  assert.equal(progress.weeksLeftInYear, 52);
  assert.equal(progress.weekStart.toDateString(), localDate(2025, 11, 29).toDateString());
  assert.equal(progress.weekEnd.toDateString(), localDate(2026, 0, 4).toDateString());
  assert.equal(progress.daysLeftInWeek, 3);
});

test('January 1 is week 1 with Sunday as the first day', () => {
  const progress = getYearProgress(localDate(2026, 0, 1), 'sunday');

  assert.equal(progress.weekOfYear, 1);
  assert.equal(progress.totalWeeksInYear, 53);
  assert.equal(progress.weeksLeftInYear, 52);
  assert.equal(progress.weekStart.toDateString(), localDate(2025, 11, 28).toDateString());
  assert.equal(progress.weekEnd.toDateString(), localDate(2026, 0, 3).toDateString());
  assert.equal(progress.daysLeftInWeek, 2);
});

test('October 21 2026 is day 294, week 43 of 53 with Monday start', () => {
  const progress = getYearProgress(localDate(2026, 9, 21), 'monday');

  assert.equal(progress.dayOfYear, 294);
  assert.equal(progress.daysLeftInYear, 71);
  assert.equal(progress.weekOfYear, 43);
  assert.equal(progress.totalWeeksInYear, 53);
  assert.equal(progress.weeksLeftInYear, 10);
  assert.equal(progress.weekStart.toDateString(), localDate(2026, 9, 19).toDateString());
  assert.equal(progress.weekEnd.toDateString(), localDate(2026, 9, 25).toDateString());
  assert.equal(progress.daysLeftInWeek, 4);
  assert.equal(progress.monthNumber, 10);
  assert.equal(progress.dayOfMonth, 21);
  assert.equal(progress.daysInMonth, 31);
  assert.equal(progress.daysLeftInMonth, 10);
  assert.equal(progress.monthsLeftInYear, 2);
  assert.equal(progress.quarter, 4);
  assert.equal(progress.yearPercent, 80);
});

test('October 21 2026 uses the same week number with Sunday start', () => {
  const progress = getYearProgress(localDate(2026, 9, 21), 'sunday');

  assert.equal(progress.weekOfYear, 43);
  assert.equal(progress.totalWeeksInYear, 53);
  assert.equal(progress.weeksLeftInYear, 10);
  assert.equal(progress.weekStart.toDateString(), localDate(2026, 9, 18).toDateString());
  assert.equal(progress.weekEnd.toDateString(), localDate(2026, 9, 24).toDateString());
  assert.equal(progress.daysLeftInWeek, 3);
});

test('leap day is day 60 of 366', () => {
  const progress = getYearProgress(localDate(2024, 1, 29), 'monday');

  assert.equal(progress.isLeapYear, true);
  assert.equal(progress.daysInYear, 366);
  assert.equal(progress.dayOfYear, 60);
  assert.equal(progress.daysLeftInYear, 306);
  assert.equal(progress.weekOfYear, 9);
  assert.equal(progress.daysInMonth, 29);
  assert.equal(progress.daysLeftInMonth, 0);
});

test('December 31 is the last week and has no days or weeks left', () => {
  const progress = getYearProgress(localDate(2026, 11, 31), 'monday');

  assert.equal(progress.dayOfYear, 365);
  assert.equal(progress.daysLeftInYear, 0);
  assert.equal(progress.weekOfYear, 53);
  assert.equal(progress.totalWeeksInYear, 53);
  assert.equal(progress.weeksLeftInYear, 0);
  assert.equal(progress.monthsLeftInYear, 0);
  assert.equal(progress.quarter, 4);
});

test('a year cannot report negative weeks left', () => {
  for (const year of [2024, 2025, 2026, 2027, 2028]) {
    for (const firstDay of ['monday', 'sunday'] as const) {
      const progress = getYearProgress(localDate(year, 11, 31), firstDay);
      assert.ok(progress.weeksLeftInYear >= 0, `${year} ${firstDay}`);
      assert.ok(progress.weekOfYear <= progress.totalWeeksInYear, `${year} ${firstDay}`);
    }
  }
});

test('leap years are detected correctly', () => {
  assert.equal(isLeapYear(2024), true);
  assert.equal(isLeapYear(2025), false);
  assert.equal(isLeapYear(1900), false);
  assert.equal(isLeapYear(2000), true);
});

test('greeting follows the four time bands', () => {
  const cases: Array<[number, string]> = [
    [4, 'night'],
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [16, 'afternoon'],
    [17, 'evening'],
    [20, 'evening'],
    [21, 'night'],
    [23, 'night'],
    [0, 'night'],
  ];

  for (const [hour, expected] of cases) {
    assert.equal(getGreeting(localDate(2026, 9, 21, hour)), expected, `hour ${hour}`);
  }
});

test('greeting labels are readable', () => {
  assert.equal(getGreetingLabel('morning'), 'Good Morning');
  assert.equal(getGreetingLabel('afternoon'), 'Good Afternoon');
  assert.equal(getGreetingLabel('evening'), 'Good Evening');
  assert.equal(getGreetingLabel('night'), 'Good Night');
});

test('week helper returns consistent week boundaries', () => {
  const week = getWeekOfYear(localDate(2026, 9, 21), 'monday');

  assert.equal(week.weekOfYear, 43);
  assert.equal(week.totalWeeksInYear, 53);
  assert.equal(week.weekStart.toDateString(), localDate(2026, 9, 19).toDateString());
  assert.equal(week.weekEnd.toDateString(), localDate(2026, 9, 25).toDateString());
  assert.equal(week.daysLeftInWeek, 4);
});

test('left labels handle singular, plural and last unit', () => {
  assert.equal(formatWeeksLeft(0), 'Last week');
  assert.equal(formatWeeksLeft(1), '1 week left');
  assert.equal(formatWeeksLeft(10), '10 weeks left');
  assert.equal(formatDaysLeft(0), 'Last day');
  assert.equal(formatDaysLeft(1), '1 day left');
  assert.equal(formatMonthsLeft(0), 'Last month');
  assert.equal(formatMonthsLeft(2), '2 months left');
});
