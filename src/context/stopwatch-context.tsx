import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { startRinging, stopRinging } from '@/utils/alarm-ringer';
import { alarmPopup, safely } from '@/utils/alarm-popup';
import {
  cancelQuickAlarmAsync,
  fixAlarmHealthAsync,
  getAlarmHealthAsync,
  prepareQuickAlarmsAsync,
  scheduleQuickAlarmAsync,
  usesAlarmPopup,
  type AlarmHealth,
} from '@/utils/quick-alarm';
import {
  MAX_ACTIVE_ALARMS,
  RING_WINDOW_MS,
  SNOOZE_MS,
  addSavedTimer,
  defaultAlarmLabel,
  elapsedMs,
  formatClock,
  makeLap,
  mergeFinished,
  parseStoredAlarms,
  parseStoredStopwatch,
  splitAlarms,
  type Lap,
  type QuickAlarm,
  type SavedTimer,
} from '@/utils/stopwatch';

export type StartAlarmResult = 'ok' | 'limit' | 'unavailable';

type StopwatchContextType = {
  /** Whole seconds on the stopwatch. */
  seconds: number;
  isRunning: boolean;
  /** Newest first. */
  laps: Lap[];
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addLap: () => void;
  clearLaps: () => void;

  /** Countdowns still running, soonest first. */
  alarms: QuickAlarm[];
  /** Countdowns that have rung and are waiting to be dismissed or snoozed. */
  finishedAlarms: QuickAlarm[];
  /** Finished alarms that are ringing right now (looping tone + vibration). */
  ringingIds: string[];
  savedTimers: SavedTimer[];
  /** Linked timers can start the stopwatch, add lap markers, and pause it after the last linked alarm is stopped. */
  syncStopwatch: boolean;
  setSyncStopwatch: (value: boolean) => void;
  startQuickAlarm: (durationMs: number, label?: string, syncWithStopwatch?: boolean) => Promise<StartAlarmResult>;
  cancelQuickAlarm: (id: string) => void;
  dismissFinishedAlarm: (id: string, pauseWhenIdle?: boolean) => void;
  snoozeFinishedAlarm: (id: string) => Promise<StartAlarmResult>;
  saveTimer: (label: string, durationMs: number) => void;
  removeSavedTimer: (id: string) => void;
  /** Android settings that make timers late or stop the pop-up. All true when fine. */
  alarmHealth: AlarmHealth;
  fixAlarmHealth: (problem: keyof AlarmHealth) => void;
};

const StopwatchContext = createContext<StopwatchContextType | undefined>(undefined);

const NOTIFICATION_ID = 'cashtrack-stopwatch-active';
const STOPWATCH_KEY = 'cashtrack-stopwatch-v1';
const ALARMS_KEY = 'cashtrack-quick-alarms-v1';

type SwState = { running: boolean; baseMs: number; startedAt: number; laps: Lap[] };
const INITIAL_SW: SwState = { running: false, baseMs: 0, startedAt: 0, laps: [] };

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {
    // Expo Go fallback
  }
}

async function updateNotification(secs: number, running: boolean) {
  if (Platform.OS === 'web' || !NotificationsModule) return;
  try {
    if (running) {
      await NotificationsModule.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: '⏱️ CashTrack Stopwatch Running',
          body: `Elapsed time: ${formatClock(secs)}`,
          sound: false,
          priority: NotificationsModule.AndroidNotificationPriority?.LOW ?? 1,
        },
        trigger: null,
      });
    } else {
      await NotificationsModule.dismissNotificationAsync(NOTIFICATION_ID);
    }
  } catch {
    // Ignore notification errors if permissions aren't granted or running in Expo Go
  }
}

const newAlarmId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

export function StopwatchProvider({ children }: { children: React.ReactNode }) {
  const [sw, setSw] = useState<SwState>(INITIAL_SW);
  const [seconds, setSeconds] = useState<number>(0);
  const [alarms, setAlarms] = useState<QuickAlarm[]>([]);
  const [finishedAlarms, setFinishedAlarms] = useState<QuickAlarm[]>([]);
  const [ringingIds, setRingingIds] = useState<string[]>([]);
  const [savedTimers, setSavedTimers] = useState<SavedTimer[]>([]);
  const [syncStopwatch, setSyncStopwatchState] = useState<boolean>(false);
  const [alarmHealth, setAlarmHealth] = useState<AlarmHealth>({ exactAlarms: true, fullScreen: true });

  // Refs mirror state so event handlers and timers always see the latest values.
  const swRef = useRef<SwState>(INITIAL_SW);
  const alarmsRef = useRef<QuickAlarm[]>([]);
  const savedRef = useRef<SavedTimer[]>([]);
  const syncRef = useRef<boolean>(false);
  const stopwatchStartedByTimerRef = useRef(false);
  const hydratedRef = useRef<boolean>(false);
  const finishedRef = useRef<QuickAlarm[]>([]);
  const backgroundRungRef = useRef<QuickAlarm[]>([]);
  const lastNotificationSecondRef = useRef<number | null>(null);
  /** Hydration runs before syncNative exists; a ref lets it call the latest one. */
  const syncNativeRef = useRef<() => void>(() => {});

  const persistStopwatch = useCallback(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STOPWATCH_KEY, JSON.stringify(swRef.current)).catch(() => {});
  }, []);

  const persistAlarms = useCallback(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(
      ALARMS_KEY,
      JSON.stringify({
        active: alarmsRef.current,
        finished: finishedRef.current,
        saved: savedRef.current,
        syncStopwatch: syncRef.current,
        stopwatchStartedByTimer: stopwatchStartedByTimerRef.current,
      }),
    ).catch(() => {});
  }, []);

  const commitSw = useCallback(
    (next: SwState) => {
      swRef.current = next;
      setSw(next);
      setSeconds(Math.floor(elapsedMs(next, Date.now()) / 1000));
      persistStopwatch();
    },
    [persistStopwatch],
  );

  const commitAlarms = useCallback(
    (next: QuickAlarm[]) => {
      const sorted = [...next].sort((a, b) => a.endAt - b.endAt);
      alarmsRef.current = sorted;
      setAlarms(sorted);
      persistAlarms();
    },
    [persistAlarms],
  );

  const commitFinished = useCallback(
    (next: QuickAlarm[]) => {
      finishedRef.current = next;
      setFinishedAlarms(next);
      persistAlarms();
    },
    [persistAlarms],
  );

  const refreshAlarmHealth = useCallback(() => {
    getAlarmHealthAsync()
      .then((health) =>
        setAlarmHealth((prev) =>
          prev.exactAlarms === health.exactAlarms && prev.fullScreen === health.fullScreen ? prev : health,
        ),
      )
      .catch(() => {});
  }, []);

  // One looping tone + vibration while anything is ringing. With the native
  // pop-up alarm the phone is already ringing, so the app stays quiet.
  const isRinging = ringingIds.length > 0;
  useEffect(() => {
    if (!isRinging || usesAlarmPopup) return;
    void startRinging();
    return () => stopRinging();
  }, [isRinging]);

  // Restore everything the user left running or saved.
  useEffect(() => {
    let alive = true;
    (async () => {
      let rawSw: string | null = null;
      let rawAlarms: string | null = null;
      try {
        [rawSw, rawAlarms] = await Promise.all([AsyncStorage.getItem(STOPWATCH_KEY), AsyncStorage.getItem(ALARMS_KEY)]);
      } catch {
        // Fall through with defaults.
      }
      if (!alive) return;

      const storedSw = parseStoredStopwatch(rawSw);
      if (storedSw) {
        swRef.current = storedSw;
        setSw(storedSw);
        setSeconds(Math.floor(elapsedMs(storedSw, Date.now()) / 1000));
      }

      const storedAlarms = parseStoredAlarms(rawAlarms);
      if (storedAlarms) {
        // Timers that ran out while the app was closed already rang through the
        // OS; show them as finished so the user can see what they missed.
        const { active, expired } = splitAlarms(storedAlarms.active, Date.now());
        alarmsRef.current = active;
        setAlarms(active);
        const finished = mergeFinished(storedAlarms.finished, expired);
        finishedRef.current = finished;
        setFinishedAlarms(finished);
        savedRef.current = storedAlarms.saved;
        setSavedTimers(storedAlarms.saved);
        syncRef.current = storedAlarms.syncStopwatch;
        stopwatchStartedByTimerRef.current = storedAlarms.stopwatchStartedByTimer;
        setSyncStopwatchState(storedAlarms.syncStopwatch);
      }
      hydratedRef.current = true;
      persistAlarms();
      syncNativeRef.current();
      refreshAlarmHealth();
    })();
    return () => {
      alive = false;
    };
  }, [persistAlarms, refreshAlarmHealth]);

  // Tick the visible seconds from the wall clock, so throttled or suspended
  // timers never lose elapsed time.
  useEffect(() => {
    if (!sw.running) return;
    const interval = setInterval(() => {
      setSeconds(Math.floor(elapsedMs(swRef.current, Date.now()) / 1000));
    }, 250);
    return () => clearInterval(interval);
  }, [sw.running]);

  // Ongoing-stopwatch notification.
  useEffect(() => {
    void updateNotification(Math.floor(elapsedMs(swRef.current, Date.now()) / 1000), sw.running);
  }, [sw.running]);

  useEffect(() => {
    if (!sw.running || seconds <= 0 || seconds % 5 !== 0) return;
    // Updating the tray while the app is in the background keeps the process
    // busy and fights the OS for no visible gain; the time refreshes on return.
    if (AppState.currentState !== 'active') return;
    if (lastNotificationSecondRef.current === seconds) return;
    lastNotificationSecondRef.current = seconds;
    void updateNotification(seconds, true);
  }, [sw.running, seconds]);

  /** Moves alarms whose time has come to "finished" and reacts once. */
  const sweepAlarms = useCallback(() => {
    const now = Date.now();
    const { active, expired } = splitAlarms(alarmsRef.current, now);
    if (expired.length === 0) return;

    commitAlarms(active);
    commitFinished(mergeFinished(finishedRef.current, expired));

    // Ring like a phone alarm, but only for timers that just ended: one that
    // finished minutes ago while the app was closed already rang via the OS.
    const fresh = expired.filter((alarm) => now - alarm.endAt < RING_WINDOW_MS);
    if (fresh.length > 0) {
      if (usesAlarmPopup) {
        // The native alarm rings and pops up on its own; just show it as ringing.
        if (AppState.currentState === 'active') {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setRingingIds((prev) => [...new Set([...prev, ...fresh.map((alarm) => alarm.id)])]);
        }
      } else if (AppState.currentState === 'active') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setRingingIds((prev) => [...prev, ...fresh.map((alarm) => alarm.id)]);
        // The in-app ring takes over from the system notification.
        for (const alarm of fresh) void cancelQuickAlarmAsync(alarm.id);
      } else {
        // In the background the system notification is the ringtone. Taking over
        // here would cancel it and leave only in-app audio, which Android can
        // mute once the app is no longer visible. Remember it for the return.
        backgroundRungRef.current = [...backgroundRungRef.current, ...fresh];
      }
    }

    const current = swRef.current;
    const linkedExpired = expired.filter((alarm) => alarm.syncStopwatch);
    if (linkedExpired.length > 0 && current.running) {
      const total = elapsedMs(current, now);
      let laps = current.laps;
      for (const alarm of linkedExpired) {
        laps = [makeLap(laps, total, `⏰ ${alarm.label}`), ...laps];
      }
      commitSw({ ...current, laps });
    }
  }, [commitAlarms, commitFinished, commitSw]);

  /** Pause only a stopwatch that a linked timer started, once no linked timers remain. */
  const pauseTimerIfNoLinkedAlarms = useCallback(() => {
    if (!stopwatchStartedByTimerRef.current) return;
    const hasLinkedAlarms = [...alarmsRef.current, ...finishedRef.current].some((alarm) => alarm.syncStopwatch);
    if (hasLinkedAlarms) return;

    stopwatchStartedByTimerRef.current = false;
    const current = swRef.current;
    if (current.running) {
      commitSw({ ...current, running: false, baseMs: elapsedMs(current, Date.now()) });
    }
    persistAlarms();
  }, [commitSw, persistAlarms]);

  /**
   * Catches up with the native pop-up alarm: Stop / Snooze pressed on the
   * pop-up or its notification (possibly while the app was closed), and which
   * alarms are still ringing.
   */
  const syncNative = useCallback(() => {
    if (!alarmPopup || !hydratedRef.current) return;
    sweepAlarms();

    const actions = safely((n) => n.takeActions(), []);
    let active = alarmsRef.current;
    let finished = finishedRef.current;
    let dismissedLinkedAlarm = false;
    for (const { id, action, endAt } of actions) {
      const known = finished.find((alarm) => alarm.id === id) ?? active.find((alarm) => alarm.id === id);
      finished = finished.filter((alarm) => alarm.id !== id);
      if (action === 'snooze' && endAt) {
        active = [
          ...active.filter((alarm) => alarm.id !== id),
          {
            id,
            label: known?.label ?? 'Timer',
            durationMs: SNOOZE_MS,
            endAt,
            syncStopwatch: known?.syncStopwatch ?? false,
          },
        ];
      } else if (action === 'dismiss' && known?.syncStopwatch) {
        dismissedLinkedAlarm = true;
      }
    }
    if (actions.length > 0) {
      commitAlarms(active);
      commitFinished(finished);
    }

    const nativeRinging = new Set(safely((n) => n.getRingingIds(), [] as string[]));
    const ringing = finished.filter((alarm) => nativeRinging.has(alarm.id)).map((alarm) => alarm.id);
    setRingingIds((prev) => (prev.length === ringing.length && prev.every((id, i) => id === ringing[i]) ? prev : ringing));
    if (dismissedLinkedAlarm) pauseTimerIfNoLinkedAlarms();
  }, [commitAlarms, commitFinished, pauseTimerIfNoLinkedAlarms, sweepAlarms]);

  useEffect(() => {
    syncNativeRef.current = syncNative;
  }, [syncNative]);

  useEffect(() => {
    if (!alarmPopup) return;
    const subscription = alarmPopup.addListener('onAlarmChange', () => syncNativeRef.current());
    return () => subscription.remove();
  }, []);

  // Wake exactly when the next countdown ends.
  useEffect(() => {
    if (alarms.length === 0) return;
    const next = Math.min(...alarms.map((alarm) => alarm.endAt));
    const timeout = setTimeout(sweepAlarms, Math.max(0, next - Date.now()) + 50);
    return () => clearTimeout(timeout);
  }, [alarms, sweepAlarms]);

  /**
   * Alarms that rang through the system notification while the app was in the
   * background keep ringing in-app after the user returns, so Dismiss and
   * Snooze stay reachable and the notification's tone is not left behind.
   */
  const takeOverBackgroundRinging = useCallback(() => {
    const rang = backgroundRungRef.current;
    if (rang.length === 0) return;
    backgroundRungRef.current = [];

    const now = Date.now();
    for (const alarm of rang) void cancelQuickAlarmAsync(alarm.id);

    const fresh = rang.filter((alarm) => now - alarm.endAt < RING_WINDOW_MS);
    if (fresh.length === 0) return;
    setRingingIds((prev) => {
      const next = new Set(prev);
      for (const alarm of fresh) next.add(alarm.id);
      return [...next];
    });
  }, []);

  // Coming back to the app: timers were frozen, so catch up immediately.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setSeconds(Math.floor(elapsedMs(swRef.current, Date.now()) / 1000));
      sweepAlarms();
      if (usesAlarmPopup) syncNative();
      else takeOverBackgroundRinging();
      refreshAlarmHealth();
    });
    return () => subscription.remove();
  }, [refreshAlarmHealth, sweepAlarms, syncNative, takeOverBackgroundRinging]);

  /* ---------- Stopwatch actions ---------- */

  const startTimer = useCallback(() => {
    const current = swRef.current;
    if (current.running) return;
    // A manual stopwatch start takes ownership away from the timer feature.
    stopwatchStartedByTimerRef.current = false;
    persistAlarms();
    commitSw({ ...current, running: true, startedAt: Date.now() });
  }, [commitSw, persistAlarms]);

  const pauseTimer = useCallback(() => {
    const current = swRef.current;
    stopwatchStartedByTimerRef.current = false;
    persistAlarms();
    if (!current.running) return;
    commitSw({ ...current, running: false, baseMs: elapsedMs(current, Date.now()) });
  }, [commitSw, persistAlarms]);

  const resetTimer = useCallback(() => {
    lastNotificationSecondRef.current = null;
    stopwatchStartedByTimerRef.current = false;
    persistAlarms();
    commitSw(INITIAL_SW);
  }, [commitSw, persistAlarms]);

  const addLap = useCallback(() => {
    const current = swRef.current;
    if (!current.running) return;
    const lap = makeLap(current.laps, elapsedMs(current, Date.now()));
    commitSw({ ...current, laps: [lap, ...current.laps] });
  }, [commitSw]);

  const clearLaps = useCallback(() => {
    commitSw({ ...swRef.current, laps: [] });
  }, [commitSw]);

  /* ---------- Quick alarm actions ---------- */

  const startQuickAlarm = useCallback(
    async (durationMs: number, label?: string, syncWithStopwatch = syncRef.current): Promise<StartAlarmResult> => {
      if (alarmsRef.current.length >= MAX_ACTIVE_ALARMS) return 'limit';
      if (!(await prepareQuickAlarmsAsync())) return 'unavailable';

      const alarm: QuickAlarm = {
        id: newAlarmId(),
        label: label?.trim() || defaultAlarmLabel(durationMs),
        durationMs,
        endAt: Date.now() + durationMs,
        syncStopwatch: syncWithStopwatch,
      };
      if (!(await scheduleQuickAlarmAsync(alarm.id, alarm.label, alarm.endAt))) return 'unavailable';

      // Another tap may have filled the last slot while permissions were shown.
      if (alarmsRef.current.length >= MAX_ACTIVE_ALARMS) {
        void cancelQuickAlarmAsync(alarm.id);
        return 'limit';
      }
      commitAlarms([...alarmsRef.current, alarm]);

      if (syncWithStopwatch && !swRef.current.running) {
        stopwatchStartedByTimerRef.current = true;
        commitSw({ ...swRef.current, running: true, startedAt: Date.now() });
        persistAlarms();
      }
      refreshAlarmHealth();
      return 'ok';
    },
    [commitAlarms, commitSw, persistAlarms, refreshAlarmHealth],
  );

  const cancelQuickAlarm = useCallback(
    (id: string) => {
      commitAlarms(alarmsRef.current.filter((alarm) => alarm.id !== id));
      void cancelQuickAlarmAsync(id);
      pauseTimerIfNoLinkedAlarms();
    },
    [commitAlarms, pauseTimerIfNoLinkedAlarms],
  );

  const dismissFinishedAlarm = useCallback(
    (id: string, pauseWhenIdle = true) => {
      commitFinished(finishedRef.current.filter((alarm) => alarm.id !== id));
      setRingingIds((prev) => prev.filter((ringingId) => ringingId !== id));
      void cancelQuickAlarmAsync(id);
      if (pauseWhenIdle) pauseTimerIfNoLinkedAlarms();
    },
    [commitFinished, pauseTimerIfNoLinkedAlarms],
  );

  const fixAlarmHealth = useCallback((problem: keyof AlarmHealth) => {
    void fixAlarmHealthAsync(problem);
  }, []);

  const snoozeFinishedAlarm = useCallback(
    async (id: string): Promise<StartAlarmResult> => {
      const target = finishedRef.current.find((alarm) => alarm.id === id);
      if (!target) return 'ok';
      const result = await startQuickAlarm(SNOOZE_MS, target.label, target.syncStopwatch ?? false);
      if (result === 'ok') dismissFinishedAlarm(id, false);
      return result;
    },
    [dismissFinishedAlarm, startQuickAlarm],
  );

  const saveTimer = useCallback(
    (label: string, durationMs: number) => {
      const timer: SavedTimer = { id: newAlarmId(), label: label.trim() || defaultAlarmLabel(durationMs), durationMs };
      savedRef.current = addSavedTimer(savedRef.current, timer);
      setSavedTimers(savedRef.current);
      persistAlarms();
    },
    [persistAlarms],
  );

  const removeSavedTimer = useCallback(
    (id: string) => {
      savedRef.current = savedRef.current.filter((timer) => timer.id !== id);
      setSavedTimers(savedRef.current);
      persistAlarms();
    },
    [persistAlarms],
  );

  const setSyncStopwatch = useCallback(
    (value: boolean) => {
      syncRef.current = value;
      setSyncStopwatchState(value);
      persistAlarms();
    },
    [persistAlarms],
  );

  return (
    <StopwatchContext.Provider
      value={{
        seconds,
        isRunning: sw.running,
        laps: sw.laps,
        startTimer,
        pauseTimer,
        resetTimer,
        addLap,
        clearLaps,
        alarms,
        finishedAlarms,
        ringingIds,
        savedTimers,
        syncStopwatch,
        setSyncStopwatch,
        startQuickAlarm,
        cancelQuickAlarm,
        dismissFinishedAlarm,
        snoozeFinishedAlarm,
        saveTimer,
        removeSavedTimer,
        alarmHealth,
        fixAlarmHealth,
      }}>
      {children}
    </StopwatchContext.Provider>
  );
}

export function useStopwatch() {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error('useStopwatch must be used within a StopwatchProvider');
  }
  return context;
}
