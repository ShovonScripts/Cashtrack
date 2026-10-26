import { Platform } from 'react-native';
import type { FinancialReminder } from '@/types/reminder';
import { getReminderRemainingAmount } from '@/utils/reminder-payment';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
    NotificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
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

export async function hasReminderNotificationPermissionAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  try {
    const { status } = await NotificationsModule.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

const ALARM_CHANNEL_ID = 'reminder-alarms-channel';
const TEST_ALARM_ID = 'reminder:test-alarm';

export async function ensureAlarmChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !NotificationsModule?.setNotificationChannelAsync) return;
  try {
    await NotificationsModule.setNotificationChannelAsync(ALARM_CHANNEL_ID, {
      name: 'High Priority Bill Alarms',
      importance: NotificationsModule.AndroidImportance.MAX,
      vibrationPattern: [0, 1000, 500, 1000],
      enableVibration: true,
      lightColor: '#0152F5',
      lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility.PUBLIC,
    });
  } catch {}
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

/**
 * Removes every bill/reminder notification this build has scheduled, including
 * the test alarm. Used after a restore so reminders that no longer exist cannot
 * fire on the next launch.
 */
export async function cancelAllReminderNotificationsAsync(): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    const scheduled = await NotificationsModule.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .map((notification: { identifier?: string }) => notification.identifier ?? '')
        .filter((identifier: string) => identifier.startsWith('reminder:'))
        .map((identifier: string) => NotificationsModule.cancelScheduledNotificationAsync(identifier)),
    );
  } catch {}
}

export async function scheduleReminderNotificationsAsync(
  reminder: FinancialReminder,
  formatAmount?: (amount: number | null) => string,
  options?: { requestPermission?: boolean },
): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  const hasPermission = options?.requestPermission
    ? await requestNotificationPermissionsAsync()
    : await hasReminderNotificationPermissionAsync();
  if (!hasPermission || reminder.status === 'paid' || reminder.status === 'skipped') return;

  // First cancel any existing notifications for this reminder to avoid duplicates
  await cancelReminderNotificationsAsync(reminder.id);

  const dueDate = new Date(reminder.dueDate);
  if (Number.isNaN(dueDate.getTime())) return;

  await ensureAlarmChannelAsync();

  const now = new Date();
  const remainingAmount = getReminderRemainingAmount(reminder);
  const amountStr = remainingAmount !== null && formatAmount ? formatAmount(remainingAmount) : remainingAmount !== null ? `৳${remainingAmount}` : '';
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
  if (reminder.isAlarm && reminder.alarmTime) {
    const [hours, minutes] = reminder.alarmTime.split(':').map(Number);
    if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
      dateDue.setHours(hours, minutes, 0, 0);
    } else {
      dateDue.setHours(9, 0, 0, 0);
    }
  } else {
    dateDue.setHours(9, 0, 0, 0);
  }

  const schedules = [
    { key: '3days', triggerDate: date3Days, body: `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due in 3 days.`, isAlarm: false },
    { key: '1day', triggerDate: date1Day, body: `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due tomorrow.`, isAlarm: false },
    { key: 'due', triggerDate: dateDue, body: reminder.isAlarm ? `🚨 ALARM: ${titleText}${amountStr ? ` (${amountStr})` : ''} is due now!` : `Your ${titleText}${amountStr ? ` of ${amountStr}` : ''} is due today!`, isAlarm: reminder.isAlarm },
  ];

  for (const sched of schedules) {
    if (sched.triggerDate > now) {
      try {
        await NotificationsModule.scheduleNotificationAsync({
          identifier: `reminder:${reminder.id}:${sched.key}`,
          content: {
            title: sched.isAlarm ? '🚨 Bill Alarm' : 'Payment Reminder',
            body: sched.body,
            sound: true,
            priority: sched.isAlarm ? NotificationsModule.AndroidNotificationPriority.MAX : NotificationsModule.AndroidNotificationPriority.DEFAULT,
          },
          trigger: {
            type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
            date: sched.triggerDate,
            ...(sched.isAlarm ? { channelId: ALARM_CHANNEL_ID } : {}),
          },
        });
      } catch {}
    }
  }
}

/**
 * Fires a one-off alarm notification after a few seconds so the user can
 * confirm that permissions, the high-priority channel and the sound all work.
 */
export async function scheduleTestAlarmNotificationAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;

  const hasPermission = await requestNotificationPermissionsAsync();
  if (!hasPermission) return false;

  await ensureAlarmChannelAsync();

  try {
    await NotificationsModule.cancelScheduledNotificationAsync(TEST_ALARM_ID);
  } catch {}

  try {
    await NotificationsModule.scheduleNotificationAsync({
      identifier: TEST_ALARM_ID,
      content: {
        title: 'Test Bill Alarm',
        body: 'If you can hear this, bill alarm sounds are working.',
        sound: true,
        priority: NotificationsModule.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
        channelId: ALARM_CHANNEL_ID,
      },
    });
    return true;
  } catch {
    return false;
  }
}
