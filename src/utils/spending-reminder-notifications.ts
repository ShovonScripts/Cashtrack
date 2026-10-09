import { Platform } from 'react-native';

import { getSpendingReminderMessage } from '@/constants/spending-reminders';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

export async function requestSpendingReminderPermissionsAsync(): Promise<boolean> {
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

/**
 * Cancels all currently scheduled daily spending check notifications.
 */
export async function cancelSpendingReminderNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const identifier = notification.identifier ?? '';
      if (identifier.startsWith('daily-spending-check-')) {
        await NotificationsModule.cancelScheduledNotificationAsync(identifier);
      }
    }
  } catch {}
}

/**
 * Schedules daily evening spending check notifications for the next 14 days.
 * Evening time defaults to 8:00 PM (20:00).
 * Rotates messages daily using getSpendingReminderMessage(targetDate).
 */
export async function scheduleDailySpendingReminderNotificationsAsync(
  eveningHour: number = 20,
  eveningMinute: number = 0
): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;

  const hasPermission = await requestSpendingReminderPermissionsAsync();
  if (!hasPermission) return false;

  await cancelSpendingReminderNotificationsAsync();

  const now = new Date();
  const DAYS_TO_SCHEDULE = 14;

  for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);
    targetDate.setHours(eveningHour, eveningMinute, 0, 0);

    // If target time today has already passed, skip today's notification
    if (targetDate <= now) continue;

    const dateKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    const msg = getSpendingReminderMessage(targetDate);

    try {
      await NotificationsModule.scheduleNotificationAsync({
        identifier: `daily-spending-check-${dateKey}`,
        content: {
          title: msg.title,
          body: msg.body,
          sound: true,
        },
        trigger: {
          type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });
    } catch {}
  }

  return true;
}
