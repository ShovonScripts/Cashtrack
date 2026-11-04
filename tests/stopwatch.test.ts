import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import {
  addSavedTimer,
  elapsedMs,
  formatClock,
  formatCountdown,
  formatDurationLabel,
  formatLap,
  lapExtremes,
  makeLap,
  parseDuration,
  parseStoredAlarms,
  parseStoredStopwatch,
  splitAlarms,
  type Lap,
  type QuickAlarm,
} from '../src/utils/stopwatch.ts';

describe('formatting', () => {
  test('formatClock', () => {
    assert.equal(formatClock(0), '00:00:00');
    assert.equal(formatClock(3661), '01:01:01');
    assert.equal(formatClock(-5), '00:00:00');
  });

  test('formatLap keeps centiseconds and uncapped minutes', () => {
    assert.equal(formatLap(0), '00:00.00');
    assert.equal(formatLap(65_430), '01:05.43');
    assert.equal(formatLap(61 * 60_000), '61:00.00');
  });

  test('formatCountdown rounds up and adds hours only when needed', () => {
    assert.equal(formatCountdown(300_000), '05:00');
    assert.equal(formatCountdown(299_100), '05:00');
    assert.equal(formatCountdown(1), '00:01');
    assert.equal(formatCountdown(0), '00:00');
    assert.equal(formatCountdown(3_600_000), '1:00:00');
  });

  test('formatDurationLabel', () => {
    assert.equal(formatDurationLabel(45_000), '45 sec');
    assert.equal(formatDurationLabel(300_000), '5 min');
    assert.equal(formatDurationLabel(5_400_000), '1 hr 30 min');
    assert.equal(formatDurationLabel(150_000), '2 min 30 sec');
  });
});

describe('parseDuration', () => {
  test('accepts blanks as zero', () => {
    assert.equal(parseDuration('', '5', ''), 300_000);
    assert.equal(parseDuration('1', '', '30'), 3_630_000);
  });

  test('rejects empty, zero, non-numeric and too long', () => {
    assert.equal(parseDuration('', '', ''), null);
    assert.equal(parseDuration('0', '0', '0'), null);
    assert.equal(parseDuration('a', '5', ''), null);
    assert.equal(parseDuration('-1', '5', ''), null);
    assert.equal(parseDuration('1.5', '', ''), null);
    assert.equal(parseDuration('24', '0', '0'), null);
  });

  test('allows minutes and seconds above 59', () => {
    assert.equal(parseDuration('', '90', ''), 5_400_000);
    assert.equal(parseDuration('', '', '120'), 120_000);
  });
});

describe('stopwatch maths', () => {
  test('elapsedMs when paused and running', () => {
    assert.equal(elapsedMs({ running: false, baseMs: 5000, startedAt: 0 }, 99_999), 5000);
    assert.equal(elapsedMs({ running: true, baseMs: 5000, startedAt: 1000 }, 4000), 8000);
    assert.equal(elapsedMs({ running: true, baseMs: 0, startedAt: 5000 }, 4000), 0);
  });

  test('makeLap records split from the previous lap', () => {
    const first = makeLap([], 10_000);
    assert.equal(first.index, 1);
    assert.equal(first.splitMs, 10_000);
    const second = makeLap([first], 25_000);
    assert.equal(second.index, 2);
    assert.equal(second.splitMs, 15_000);
  });

  test('timer markers do not disturb lap numbering or splits', () => {
    const first = makeLap([], 10_000);
    const marker = makeLap([first], 20_000, '5 min');
    assert.equal(marker.label, '5 min');
    assert.equal(marker.splitMs, 0);
    const next = makeLap([marker, first], 30_000);
    assert.equal(next.index, 2);
    assert.equal(next.splitMs, 20_000);
  });

  test('lapExtremes needs three timed laps and ignores markers', () => {
    const mk = (index: number, splitMs: number, label?: string): Lap => ({
      id: `l${index}`,
      index,
      totalMs: 0,
      splitMs,
      ...(label ? { label } : {}),
    });
    assert.deepEqual(lapExtremes([mk(2, 5), mk(1, 9)]), { bestId: null, worstId: null });
    assert.deepEqual(lapExtremes([mk(3, 7), mk(2, 5), mk(1, 9)]), { bestId: 'l2', worstId: 'l1' });
    assert.deepEqual(lapExtremes([mk(3, 7), mk(2, 1, 'marker'), mk(1, 9)]), { bestId: null, worstId: null });
    assert.deepEqual(lapExtremes([mk(3, 5), mk(2, 5), mk(1, 5)]), { bestId: null, worstId: null });
  });
});

describe('alarms', () => {
  const alarm = (id: string, endAt: number): QuickAlarm => ({ id, label: id, durationMs: 1000, endAt });

  test('splitAlarms separates and sorts', () => {
    const { active, expired } = splitAlarms([alarm('c', 300), alarm('a', 100), alarm('b', 200), alarm('d', 50)], 150);
    assert.deepEqual(active.map((a) => a.id), ['b', 'c']);
    assert.deepEqual(expired.map((a) => a.id), ['d', 'a']);
  });

  test('an alarm due exactly now has expired', () => {
    assert.equal(splitAlarms([alarm('a', 100)], 100).expired.length, 1);
  });

  test('addSavedTimer dedupes and caps', () => {
    let list = addSavedTimer([], { id: '1', label: 'Tea', durationMs: 180_000 });
    list = addSavedTimer(list, { id: '2', label: 'Tea', durationMs: 180_000 });
    assert.equal(list.length, 1);
    assert.equal(list[0].id, '2');
    for (let i = 0; i < 12; i += 1) list = addSavedTimer(list, { id: `x${i}`, label: `T${i}`, durationMs: 1000 + i });
    assert.equal(list.length, 8);
    assert.equal(list[0].id, 'x11');
  });
});

describe('stored data validation', () => {
  test('parseStoredStopwatch rejects junk', () => {
    assert.equal(parseStoredStopwatch(null), null);
    assert.equal(parseStoredStopwatch('not json'), null);
    assert.equal(parseStoredStopwatch('{"running":"yes"}'), null);
  });

  test('parseStoredStopwatch keeps valid laps only', () => {
    const parsed = parseStoredStopwatch(
      JSON.stringify({
        running: true,
        baseMs: 100,
        startedAt: 5,
        laps: [{ id: 'a', index: 1, totalMs: 1, splitMs: 1 }, { id: 'b' }, null],
      }),
    );
    assert.equal(parsed?.running, true);
    assert.equal(parsed?.laps.length, 1);
  });

  test('parseStoredAlarms filters bad entries and defaults sync off', () => {
    const parsed = parseStoredAlarms(
      JSON.stringify({
        active: [{ id: 'a', label: 'x', durationMs: 1, endAt: 2 }, { id: 'broken' }],
        saved: [{ id: 's', label: 'Tea', durationMs: 5 }, 7],
      }),
    );
    assert.equal(parsed?.active.length, 1);
    assert.equal(parsed?.saved.length, 1);
    assert.equal(parsed?.syncStopwatch, false);
    assert.equal(parseStoredAlarms('[]')?.active.length, 0);
  });
});
