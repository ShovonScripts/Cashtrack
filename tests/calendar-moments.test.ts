import assert from 'node:assert/strict';
import { describe, test } from 'node:test';

import { getUpcomingCalendarMoments } from '../src/utils/calendar-moments.ts';
import { sanitizePreferences } from '../src/utils/preferences.ts';
import { DEFAULT_PREFERENCES } from '../src/types/preferences.ts';

const local = (year: number, monthIndex: number, day: number, hour = 12) =>
  new Date(year, monthIndex, day, hour, 0, 0, 0);

describe('getUpcomingCalendarMoments', () => {
  test('returns the soonest moments first', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 0, 15), { limit: 8 });
    assert.equal(moments.length, 8);
    assert.equal(moments[0].id, 'calendar-moment-month-end-2026-01-31');
    assert.equal(moments[0].date.getHours(), 20);
    assert.equal(moments[1].id, 'calendar-moment-month-start-2026-02-01');
    assert.equal(moments[1].date.getHours(), 9);
    for (let i = 1; i < moments.length; i += 1) {
      assert.ok(moments[i].date.getTime() > moments[i - 1].date.getTime());
    }
  });

  test('month-end lands on the real last day of short months', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 0, 15), { limit: 40 });
    const febEnd = moments.find(
      (m) => m.kind === 'month-end' && m.date.getMonth() === 1 && m.date.getFullYear() === 2026
    );
    assert.ok(febEnd);
    assert.equal(febEnd.date.getDate(), 28);
  });

  test('month-end lands on Feb 29 in a leap year', () => {
    const moments = getUpcomingCalendarMoments(local(2028, 0, 15), { limit: 40 });
    const febEnd = moments.find(
      (m) => m.kind === 'month-end' && m.date.getMonth() === 1 && m.date.getFullYear() === 2028
    );
    assert.ok(febEnd);
    assert.equal(febEnd.date.getDate(), 29);
  });

  test('year milestones replace the January start and December end', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 11, 20), { limit: 40 });
    const ids = moments.map((m) => m.id);
    assert.ok(!ids.includes('calendar-moment-month-end-2026-12-31'));
    assert.ok(!ids.includes('calendar-moment-month-start-2027-01-01'));
    assert.ok(ids.includes('calendar-moment-year-final-2026-12-31'));
    assert.ok(ids.includes('calendar-moment-year-start-2027-01-01'));
  });

  test('the December countdown states how many days are left', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 11, 20), { limit: 40 });
    const countdown = moments.find((m) => m.kind === 'year-countdown' && m.date.getFullYear() === 2026);
    assert.ok(countdown);
    assert.equal(countdown.title, '5 days left in 2026');
    assert.equal(countdown.date.getDate(), 26);
  });

  test('year-start is January 1 at 9:00 and year-final is December 31 at 20:00', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 11, 20), { limit: 40 });
    const start = moments.find((m) => m.id === 'calendar-moment-year-start-2027-01-01');
    const final = moments.find((m) => m.id === 'calendar-moment-year-final-2026-12-31');
    assert.ok(start && final);
    assert.equal(start.date.getMonth(), 0);
    assert.equal(start.date.getDate(), 1);
    assert.equal(start.date.getHours(), 9);
    assert.equal(final.date.getMonth(), 11);
    assert.equal(final.date.getDate(), 31);
    assert.equal(final.date.getHours(), 20);
  });

  test('copy is derived from the moment date, not the current date', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 0, 15), { limit: 40 });
    const febStart = moments.find((m) => m.id === 'calendar-moment-month-start-2026-02-01');
    assert.ok(febStart);
    assert.match(febStart.body, /February/);
  });

  test('never returns a moment in the past', () => {
    const now = local(2026, 4, 10);
    const moments = getUpcomingCalendarMoments(now, { limit: 40 });
    for (const moment of moments) {
      assert.ok(moment.date.getTime() > now.getTime());
    }
  });

  test('respects the horizon window', () => {
    const minutes = getUpcomingCalendarMoments(local(2026, 0, 15), { horizonDays: 5, limit: 100 });
    assert.equal(minutes.length, 0);
    const soon = getUpcomingCalendarMoments(local(2026, 0, 28), { horizonDays: 5, limit: 100 });
    assert.ok(soon.length >= 1);
  });

  test('respects the limit and keeps ids/timestamps unique', () => {
    const moments = getUpcomingCalendarMoments(local(2026, 0, 15), { limit: 5 });
    assert.equal(moments.length, 5);
    assert.equal(new Set(moments.map((m) => m.id)).size, moments.length);
    assert.equal(new Set(moments.map((m) => m.date.getTime())).size, moments.length);
  });
});

describe('calendar moments preference', () => {
  test('is off by default and survives a stored boolean', () => {
    assert.equal(DEFAULT_PREFERENCES.enableCalendarMoments, false);
    assert.equal(sanitizePreferences({}).enableCalendarMoments, false);
    assert.equal(sanitizePreferences({ enableCalendarMoments: true }).enableCalendarMoments, true);
    assert.equal(sanitizePreferences({ enableCalendarMoments: 'yes' }).enableCalendarMoments, false);
  });
});
