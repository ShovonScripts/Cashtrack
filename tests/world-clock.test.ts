import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { getTimeDifference } from '../src/utils/world-clock.ts';

// The device zone is whatever the test machine uses, so pin it to UTC.
process.env.TZ = 'UTC';
const noon = new Date('2026-01-15T12:00:00Z');

describe('getTimeDifference (device in UTC)', () => {
  test('same zone', () => {
    const diff = getTimeDifference('UTC', noon);
    assert.equal(diff?.label, 'Same time');
    assert.equal(diff?.direction, 'same');
  });

  test('whole-hour zones', () => {
    assert.equal(getTimeDifference('Asia/Dubai', noon)?.label, '4h ahead');
    assert.equal(getTimeDifference('America/New_York', noon)?.label, '5h behind');
  });

  test('half-hour and 45-minute zones are not rounded', () => {
    assert.equal(getTimeDifference('Asia/Kolkata', noon)?.label, '5h 30m ahead');
    assert.equal(getTimeDifference('Asia/Kolkata', noon)?.badge, '+5:30');
    assert.equal(getTimeDifference('Asia/Kathmandu', noon)?.label, '5h 45m ahead');
  });

  test('day label crosses midnight', () => {
    const lateNight = new Date('2026-01-15T22:00:00Z');
    assert.equal(getTimeDifference('Asia/Tokyo', lateNight)?.dayLabel, 'Tomorrow');
    assert.equal(getTimeDifference('Pacific/Honolulu', new Date('2026-01-15T05:00:00Z'))?.dayLabel, 'Yesterday');
    assert.equal(getTimeDifference('Europe/Paris', noon)?.dayLabel, 'Today');
  });

  test('daylight saving is respected', () => {
    assert.equal(getTimeDifference('America/New_York', new Date('2026-07-15T12:00:00Z'))?.label, '4h behind');
  });

  test('empty zone means the device zone; bad zone returns null', () => {
    assert.equal(getTimeDifference('', noon)?.label, 'Same time');
    assert.equal(getTimeDifference('Not/AZone', noon), null);
  });
});
