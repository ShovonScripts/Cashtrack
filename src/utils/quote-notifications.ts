import { Platform } from 'react-native';

import { getQuoteOfTheDay } from '@/constants/quotes';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

export async function requestQuoteNotificationPermissionsAsync(): Promise<boolean> {
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
 * Cancels all currently scheduled quote notifications.
 */
export async function cancelQuoteNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const identifier = notification.identifier ?? '';
      if (identifier.startsWith('daily-quote-')) {
        await NotificationsModule.cancelScheduledNotificationAsync(identifier);
      }
    }
  } catch {}
}

/**
 * Schedules daily morning quote notifications for the next 14 days.
 * Morning time defaults to 8:00 AM.
 * Each scheduled notification uses getQuoteOfTheDay(targetDate) so that
 * the quote in the morning notification matches the quote on the cover slide.
 */
export async function scheduleDailyQuoteNotificationsAsync(morningHour: number = 8, morningMinute: number = 0): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;

  const hasPermission = await requestQuoteNotificationPermissionsAsync();
  if (!hasPermission) return false;

  await cancelQuoteNotificationsAsync();

  const now = new Date();
  const DAYS_TO_SCHEDULE = 14;

  for (let i = 0; i < DAYS_TO_SCHEDULE; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);
    targetDate.setHours(morningHour, morningMinute, 0, 0);

    // If target time today has already passed, skip today's notification
    if (targetDate <= now) continue;

    const dateKey = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    const quote = getQuoteOfTheDay(targetDate);

    try {
      await NotificationsModule.scheduleNotificationAsync({
        identifier: `daily-quote-${dateKey}`,
        content: {
          title: 'Morning Motivation 💡',
          body: `“${quote.quote}” — ${quote.author}`,
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
