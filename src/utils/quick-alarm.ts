import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import {
  hasExactAlarmPermissionAsync,
  requestExactAlarmPermissionsAsync,
  requestNotificationPermissionsAsync,
} from '@/utils/reminder-notifications';

import { alarmPopup, safely } from '@/utils/alarm-popup';
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

/**
 * Android reports a channel's sound as "custom", "default", or null when the
 * user/system silenced it. "missing" means no such channel exists, and
 * undefined means the channel could not be inspected at all.
 */
async function channelSoundAsync(channelId: string): Promise<string | null | 'missing' | undefined> {
  if (typeof NotificationsModule?.getNotificationChannelAsync !== 'function') return undefined;
  try {
    const channel = await NotificationsModule.getNotificationChannelAsync(channelId);
    if (!channel) return 'missing';
    return typeof channel.sound === 'string' ? channel.sound : null;
  } catch (error) {
    console.error('[cashtrack] Failed to read the quick alarm channel', error);
    return 'missing';
  }
}

/** Its own channel, so the user can tune quick-alarm sound apart from bill alarms. */
async function ensureQuickAlarmChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !NotificationsModule?.setNotificationChannelAsync) return;

  const state = await readChannelState();
  const sound = await channelSoundAsync(state.id);

  // A custom channel that can still make noise is the best we can do; keep it.
  if (state.custom && (sound === 'custom' || sound === undefined)) {
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
  let next: ChannelState | null = null;
  try {
    await NotificationsModule.setNotificationChannelAsync(customId, { ...channelOptions(), sound: ALARM_SOUND_FILE });
    const created = await NotificationsModule.getNotificationChannelAsync?.(customId);
    if (created?.sound === 'custom') {
      next = { id: customId, custom: true, attempt };
    } else {
      await NotificationsModule.deleteNotificationChannelAsync?.(customId);
    }
  } catch (error) {
    console.error('[cashtrack] Failed to set up the quick alarm sound channel', error);
  }

  if (!next) {
    // Android locks a channel's sound in once it exists, so a channel the user
    // (or the system) silenced can never be made loud again and needs a new id.
    const fallbackSound = state.id.startsWith(FALLBACK_CHANNEL_ID) ? sound : await channelSoundAsync(FALLBACK_CHANNEL_ID);
    const fallbackId =
      fallbackSound === null ? `${FALLBACK_CHANNEL_ID}-s${attempt}` : FALLBACK_CHANNEL_ID;
    if (fallbackSound !== 'default' && fallbackSound !== 'custom') {
      try {
        const created = await NotificationsModule.setNotificationChannelAsync(fallbackId, channelOptions());
        // A missing sound here means the alarm can only buzz. Say so, because
        // otherwise the timer just rings silently with no clue why.
        if (!created || (created.sound !== 'default' && created.sound !== 'custom')) {
          console.error('[cashtrack] Quick alarm channel has no sound', created);
        }
      } catch (error) {
        console.error('[cashtrack] Failed to set up the quick alarm channel', error);
      }
    }
    next = { id: fallbackId, custom: false, attempt };
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
  // The native pop-up alarm brings its own channel.
  if (!alarmPopup) await ensureQuickAlarmChannelAsync();
  return true;
}

/** True when timers ring through the native full-screen pop-up (Android dev/production builds). */
export const usesAlarmPopup = alarmPopup !== null;

export type AlarmHealth = {
  /** Android 12+ "Alarms & reminders". Without it a timer can ring a little late. */
  exactAlarms: boolean;
  /** Android 14+ "Full-screen notifications". Without it the alarm shows as a banner, not a pop-up. */
  fullScreen: boolean;
};

export async function getAlarmHealthAsync(): Promise<AlarmHealth> {
  if (Platform.OS !== 'android') return { exactAlarms: true, fullScreen: true };
  const exactAlarms = alarmPopup
    ? safely((n) => n.canScheduleExactAlarms(), true)
    : await hasExactAlarmPermissionAsync().catch(() => true);
  const fullScreen = safely((n) => n.canUseFullScreenIntent(), true);
  return { exactAlarms, fullScreen };
}

/** Opens the Android settings screen that fixes the given problem. */
export async function fixAlarmHealthAsync(problem: keyof AlarmHealth): Promise<void> {
  if (problem === 'fullScreen') {
    safely((n) => n.openFullScreenIntentSettings(), undefined);
    return;
  }
  await requestExactAlarmPermissionsAsync().catch(() => {});
}

/** Schedules the phone to ring at `fireAt` (epoch ms). Returns false on failure. */
export async function scheduleQuickAlarmAsync(alarmId: string, label: string, fireAt: number): Promise<boolean> {
  if (alarmPopup) {
    return safely((n) => {
      n.schedule(alarmId, label, fireAt);
      return true;
    }, false);
  }
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
  // Also cancel through expo-notifications: a timer set before this build may
  // still be waiting there.
  safely((n) => n.cancel(alarmId), undefined);
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    await NotificationsModule.cancelScheduledNotificationAsync(idFor(alarmId));
  } catch {}
  try {
    await NotificationsModule.dismissNotificationAsync(idFor(alarmId));
  } catch {}
}
