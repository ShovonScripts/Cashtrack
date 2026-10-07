import { Platform } from 'react-native';
import type { FinancialReminder } from '@/types/reminder';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Fallback for environments without notifications
  }
}

export async function requestNotificationPermissionsAsync(): Promise<boolean> {
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

export async function cancelReminderNotificationsAsync(reminderId: string): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const identifier = notification.identifier ?? '';
      if (identifier.startsWith(`reminder:${reminderId}:`)) {
        await NotificationsModule.cancelScheduledNotificationAsync(identifier);
      }
    }
  } catch {}
}

export async function scheduleReminderNotificationsAsync(reminder: FinancialReminder, formatAmount?: (amount: number | null) => string): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  const hasPermission = await requestNotificationPermissionsAsync();
  if (!hasPermission || reminder.status === 'paid' || reminder.status === 'skipped') return;

  // First cancel any existing notifications for this reminder to avoid duplicates
  await cancelReminderNotificationsAsync(reminder.id);

  const dueDate = new Date(reminder.dueDate);
  if (Number.isNaN(dueDate.getTime())) return;

  const now = new Date();
  const amountStr = reminder.amount !== null && formatAmount ? formatAmount(reminder.amount) : reminder.amount !== null ? `৳${reminder.amount}` : '';
  const titleText = reminder.title;

  // 3 days before
  const date3Days = new Date(dueDate);
  date3Days.setDate(date3Days.getDate() - 3);
  date3Days.setHours(9, 0, 0, 0);

  // 1 day before
  const date1Day = new Date(dueDate);
  date1Day.setDate(date1Day.getDate() - 1);
  date1Day.setHours(9, 0, 0, 0);

  // Due date
  const dateDue = new Date(dueDate);
  dateDue.setHours(9, 0, 0, 0);

  const schedules = [
    { key: '3days', triggerDate: date3Days, body: `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due in 3 days.` },
    { key: '1day', triggerDate: date1Day, body: `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due tomorrow.` },
    { key: 'due', triggerDate: dateDue, body: `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due today!` },
  ];

  for (const sched of schedules) {
    if (sched.triggerDate > now) {
      try {
        await NotificationsModule.scheduleNotificationAsync({
          identifier: `reminder:${reminder.id}:${sched.key}`,
          content: {
            title: 'Payment Reminder',
            body: sched.body,
            sound: true,
          },
          trigger: {
            type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
            date: sched.triggerDate,
          },
        });
      } catch {}
    }
  }
}
