import { Platform } from 'react-native';

import { getUpcomingCalendarMoments } from '@/utils/calendar-moments';
import { CALENDAR_MOMENT_SLOTS } from '@/utils/notification-budget';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

export async function requestCalendarMomentPermissionsAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  try {
    const { status: existingStatus } = await NotificationsModule.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await NotificationsModule.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch {
    return false;
  }
}

/** Cancels only the notifications this feature scheduled. */
export async function cancelCalendarMomentNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const identifier = notification.identifier ?? '';
      if (identifier.startsWith('calendar-moment-')) {
        await NotificationsModule.cancelScheduledNotificationAsync(identifier);
      }
    }
  } catch {}
}

/**
 * Schedules the next few calendar moments (month starts/ends and year
 * milestones). Cancelling by prefix first keeps this idempotent: running it on
 * every launch or foreground refresh never stacks duplicates, and the small
 * horizon stays comfortably inside the platform's pending-notification cap.
 */
export async function scheduleUpcomingCalendarMomentsAsync(now: Date = new Date()): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;

  const { status } = await NotificationsModule.getPermissionsAsync();
  if (status !== 'granted') return false;

  await cancelCalendarMomentNotificationsAsync();

  const moments = getUpcomingCalendarMoments(now, { horizonDays: 400, limit: CALENDAR_MOMENT_SLOTS });
  for (const moment of moments) {
    try {
      await NotificationsModule.scheduleNotificationAsync({
        identifier: moment.id,
        content: {
          title: moment.title,
          body: moment.body,
          sound: true,
        },
        trigger: {
          type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
          date: moment.date,
        },
      });
    } catch {}
  }

  return true;
}
