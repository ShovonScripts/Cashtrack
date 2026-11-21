import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  billsThatFitOnIos,
  CALENDAR_MOMENT_SLOTS,
  dailyNudgeDays,
  IOS_PENDING_NOTIFICATION_LIMIT,
  NOTIFICATIONS_PER_BILL,
  QUICK_ALARM_SLOTS,
} from '../src/utils/notification-budget.ts';
import { MAX_ACTIVE_ALARMS } from '../src/utils/stopwatch.ts';

describe('notification budget', () => {
  it('keeps the long window on Android and a shorter one on iOS', () => {
    assert.equal(dailyNudgeDays('android'), 14);
    assert.equal(dailyNudgeDays('ios'), 7);
  });

  it('leaves room on iOS for at least a dozen bills with all three reminders', () => {
    assert.ok(billsThatFitOnIos() >= 12, `only ${billsThatFitOnIos()} bills fit`);
    // The old 14-day window left room for far fewer.
    assert.ok(billsThatFitOnIos(14) < billsThatFitOnIos());
  });

  it('never plans past the iOS limit for the bills it says fit', () => {
    const used =
      2 * dailyNudgeDays('ios') + CALENDAR_MOMENT_SLOTS + QUICK_ALARM_SLOTS + billsThatFitOnIos() * NOTIFICATIONS_PER_BILL;
    assert.ok(used <= IOS_PENDING_NOTIFICATION_LIMIT, `${used} pending`);
    assert.equal(QUICK_ALARM_SLOTS, MAX_ACTIVE_ALARMS);
  });
});
