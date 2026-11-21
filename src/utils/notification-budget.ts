/**
 * How the app shares out pending local notifications.
 *
 * iOS keeps only the 64 soonest-firing pending local notifications for an app
 * and silently drops the rest: no error, the notification just never fires.
 * Bill reminders matter most, so on iOS the two daily nudges (the quote of the
 * day and the evening spending check) schedule a shorter window to leave them
 * room. Both nudges are rescheduled every time the app comes to the
 * foreground, so anyone who opens the app at least once a week never runs out.
 * Android has no such cap, so it keeps the longer window.
 *
 * No React Native imports, so the arithmetic runs under the node test runner.
 */
import { MAX_ACTIVE_ALARMS } from './stopwatch.ts';

export const IOS_PENDING_NOTIFICATION_LIMIT = 64;
/** Each bill gets three: three days before, the day before, and on the day. */
export const NOTIFICATIONS_PER_BILL = 3;
/** Upcoming calendar moments scheduled at once. */
export const CALENDAR_MOMENT_SLOTS = 8;
/** One per running quick timer. */
export const QUICK_ALARM_SLOTS = MAX_ACTIVE_ALARMS;

const NUDGE_DAYS = { ios: 7, other: 14 } as const;

/** Days ahead to schedule each daily nudge (quote, spending check) on this platform. */
export function dailyNudgeDays(platform: string): number {
  return platform === 'ios' ? NUDGE_DAYS.ios : NUDGE_DAYS.other;
}

/** How many bills can keep all three reminders pending on iOS alongside everything else. */
export function billsThatFitOnIos(nudgeDays: number = dailyNudgeDays('ios')): number {
  const fixed = 2 * nudgeDays + CALENDAR_MOMENT_SLOTS + QUICK_ALARM_SLOTS;
  return Math.max(0, Math.floor((IOS_PENDING_NOTIFICATION_LIMIT - fixed) / NOTIFICATIONS_PER_BILL));
}
