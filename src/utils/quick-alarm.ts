import { Platform } from 'react-native';

import {
  ensureAlarmChannelAsync,
  requestExactAlarmPermissionsAsync,
  requestNotificationPermissionsAsync,
} from '@/utils/reminder-notifications';

export const QUICK_ALARM_MINUTES = [1, 5, 10, 15, 30] as const;

const QUICK_ALARM_ID = 'quick-alarm:stopwatch';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

/** Schedules a ringing alarm `minutes` from now. Returns the fire time (ms) or null on failure. */
export async function scheduleQuickAlarmAsync(minutes: number): Promise<number | null> {
  if (Platform.OS === 'web' || !NotificationsModule) return null;

  const granted = await requestNotificationPermissionsAsync();
  if (!granted) return null;

  await requestExactAlarmPermissionsAsync();
  await ensureAlarmChannelAsync();

  try {
    await NotificationsModule.cancelScheduledNotificationAsync(QUICK_ALARM_ID);
  } catch {}

  const fireAt = Date.now() + minutes * 60 * 1000;
  try {
    await NotificationsModule.scheduleNotificationAsync({
      identifier: QUICK_ALARM_ID,
      content: {
        title: '⏰ Quick Alarm',
        body: `Your ${minutes} minute alarm is ringing!`,
        sound: true,
        priority: NotificationsModule.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: 'reminder-alarms-channel',
        delivery: 'alarmClock',
      },
    });
    return fireAt;
  } catch {
    return null;
  }
}

export async function cancelQuickAlarmAsync(): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync(QUICK_ALARM_ID);
    await NotificationsModule.dismissNotificationAsync(QUICK_ALARM_ID);
  } catch {}
}
