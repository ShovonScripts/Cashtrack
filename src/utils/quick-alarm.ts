import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  hasExactAlarmPermissionAsync,
  requestExactAlarmPermissionsAsync,
  requestNotificationPermissionsAsync,
} from '@/utils/reminder-notifications';

import { QUICK_ALARM_ID_PREFIX } from '@/utils/stopwatch';

export { QUICK_ALARM_MINUTES } from '@/utils/stopwatch';

// Android never lets an app change a channel's sound after creating it, and a
// build without the bundled tone quietly falls back to the phone's default.
// So the custom-sound channel gets a fresh id per attempt, and a plain fallback
// channel is used until a build that contains quick_alarm.wav is installed.
const ALARM_SOUND_FILE = 'quick_alarm.wav';
const FALLBACK_CHANNEL_ID = 'quick-alarms-default';
const CHANNEL_STATE_KEY = 'cashtrack-quick-alarm-channel-v3';
const OLD_CHANNEL_IDS = ['quick-alarms-channel', 'quick-alarms-v2'];
let activeChannelId = FALLBACK_CHANNEL_ID;
const EXACT_ASKED_KEY = 'cashtrack-quick-alarm-exact-asked-v1';
const idFor = (alarmId: string) => `${QUICK_ALARM_ID_PREFIX}${alarmId}`;

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

type ChannelState = { id: string; custom: boolean; attempt: number };

function channelOptions() {
  return {
    name: 'Quick Alarms & Timers',
    description: 'Rings when a stopwatch-page timer finishes.',
    importance: NotificationsModule.AndroidImportance.MAX,
    vibrationPattern: [0, 800, 400, 800, 400, 800, 400, 800, 400, 800],
    enableVibrate: true,
    bypassDnd: true,
    lightColor: '#0152F5',
    lockscreenVisibility: NotificationsModule.AndroidNotificationVisibility.PUBLIC,
    audioAttributes: {
      usage: NotificationsModule.AndroidAudioUsage?.ALARM,
      contentType: NotificationsModule.AndroidAudioContentType?.SONIFICATION,
    },
  };
}

async function readChannelState(): Promise<ChannelState> {
  try {
    const parsed = JSON.parse((await AsyncStorage.getItem(CHANNEL_STATE_KEY)) ?? 'null');
    if (parsed && typeof parsed.id === 'string' && typeof parsed.attempt === 'number') {
      return { id: parsed.id, custom: parsed.custom === true, attempt: parsed.attempt };
    }
  } catch {}
  return { id: FALLBACK_CHANNEL_ID, custom: false, attempt: 0 };
}

/** Its own channel, so the user can tune quick-alarm sound apart from bill alarms. */
async function ensureQuickAlarmChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !NotificationsModule?.setNotificationChannelAsync) return;

  const state = await readChannelState();
  if (state.custom) {
    activeChannelId = state.id;
    return;
  }

  for (const oldId of OLD_CHANNEL_IDS) {
    try {
      await NotificationsModule.deleteNotificationChannelAsync?.(oldId);
    } catch {}
  }

  // Try the bundled alarm tone. If this build does not contain it, Android
  // reports the channel sound as "default" instead of "custom".
  const attempt = state.attempt + 1;
  const customId = `quick-alarms-s${attempt}`;
  let next: ChannelState = { id: FALLBACK_CHANNEL_ID, custom: false, attempt };
  try {
    await NotificationsModule.setNotificationChannelAsync(customId, { ...channelOptions(), sound: ALARM_SOUND_FILE });
    const created = await NotificationsModule.getNotificationChannelAsync?.(customId);
    if (created?.sound === 'custom') {
      next = { id: customId, custom: true, attempt };
    } else {
      await NotificationsModule.deleteNotificationChannelAsync?.(customId);
    }
  } catch {}

  if (!next.custom) {
    try {
      await NotificationsModule.setNotificationChannelAsync(FALLBACK_CHANNEL_ID, channelOptions());
    } catch {}
  }
  activeChannelId = next.id;
  AsyncStorage.setItem(CHANNEL_STATE_KEY, JSON.stringify(next)).catch(() => {});
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
        // iOS plays the bundled file named here; Android uses the channel's sound.
        sound: Platform.OS === 'ios' ? ALARM_SOUND_FILE : true,
        priority: NotificationsModule.AndroidNotificationPriority.MAX,
      },
      trigger: {
        type: NotificationsModule.SchedulableTriggerInputTypes.DATE,
        date: new Date(fireAt),
        channelId: activeChannelId,
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
