import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  hasExactAlarmPermissionAsync,
  requestExactAlarmPermissionsAsync,
  requestNotificationPermissionsAsync,
} from '@/utils/reminder-notifications';

export { QUICK_ALARM_MINUTES } from '@/utils/stopwatch';

// v2: the first version set sound: 'default', which Android read as a missing
// sound file and made the channel silent. Channels cannot be edited once
// created, so the fix needs a new id.
const QUICK_ALARM_CHANNEL_ID = 'quick-alarms-v2';
const OLD_QUICK_ALARM_CHANNEL_ID = 'quick-alarms-channel';
const EXACT_ASKED_KEY = 'cashtrack-quick-alarm-exact-asked-v1';
const idFor = (alarmId: string) => `quick-alarm:${alarmId}`;

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

/** Its own channel, so the user can tune quick-alarm sound apart from bill alarms. */
async function ensureQuickAlarmChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !NotificationsModule?.setNotificationChannelAsync) return;
  try {
    await NotificationsModule.deleteNotificationChannelAsync?.(OLD_QUICK_ALARM_CHANNEL_ID);
  } catch {}
  try {
    await NotificationsModule.setNotificationChannelAsync(QUICK_ALARM_CHANNEL_ID, {
      name: 'Quick Alarms & Timers',
      description: 'Rings when a stopwatch-page timer finishes.',
      importance: NotificationsModule.AndroidImportance.MAX,
      // No `sound` key on purpose: leaving it out selects the default sound.
      vibrationPattern: [0, 800, 400, 800, 400, 800],
      enableVibrate: true,
      bypassDnd: true,
      lightColor: '#0152F5',
      lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility.PUBLIC,
      audioAttributes: {
        usage: NotificationsModule.AndroidAudioUsage?.ALARM,
        contentType: NotificationsModule.AndroidAudioContentType?.SONIFICATION,
      },
    });
  } catch {}
}

/**
 * Android 14+ denies exact alarms by default, and asking opens the system
 * Settings screen. Ask at most once, and only when it is really missing, so
 * starting a timer never throws the user out of the app again and again.
 * Without it the timer still rings, just possibly a little late.
 */
async function askForExactAlarmOnceAsync(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (await hasExactAlarmPermissionAsync()) return;
    if ((await AsyncStorage.getItem(EXACT_ASKED_KEY)) === '1') return;
    await AsyncStorage.setItem(EXACT_ASKED_KEY, '1');
    await requestExactAlarmPermissionsAsync();
  } catch {}
}

/**
 * Asks for permission once, so several alarms started together do not each
 * open a prompt. Returns false when the phone cannot ring (denied, web, Expo Go).
 */
export async function prepareQuickAlarmsAsync(): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  const granted = await requestNotificationPermissionsAsync();
  if (!granted) return false;
  await askForExactAlarmOnceAsync();
  await ensureQuickAlarmChannelAsync();
  return true;
}

/** Schedules the phone to ring at `fireAt` (epoch ms). Returns false on failure. */
export async function scheduleQuickAlarmAsync(alarmId: string, label: string, fireAt: number): Promise<boolean> {
  if (Platform.OS === 'web' || !NotificationsModule) return false;
  try {
    await NotificationsModule.scheduleNotificationAsync({
      identifier: idFor(alarmId),
      content: {
        title: '⏰ Time\'s up!',
        body: `${label} timer is ringing.`,
        sound: true,
        priority: NotificationsModule.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: QUICK_ALARM_CHANNEL_ID,
        delivery: 'alarmClock',
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function cancelQuickAlarmAsync(alarmId: string): Promise<void> {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync(idFor(alarmId));
  } catch {}
  try {
    await NotificationsModule.dismissNotificationAsync(idFor(alarmId));
  } catch {}
}
