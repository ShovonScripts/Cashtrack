import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';

import { cancelQuickAlarmAsync, prepareQuickAlarmsAsync, scheduleQuickAlarmAsync } from '@/utils/quick-alarm';
import {
  MAX_ACTIVE_ALARMS,
  SNOOZE_MS,
  addSavedTimer,
  defaultAlarmLabel,
  elapsedMs,
  formatClock,
  makeLap,
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
  savedTimers: SavedTimer[];
  /** When on, starting a timer also starts the stopwatch and a finished timer drops a lap marker. */
  syncStopwatch: boolean;
  setSyncStopwatch: (value: boolean) => void;
  startQuickAlarm: (durationMs: number, label?: string) => Promise<StartAlarmResult>;
  cancelQuickAlarm: (id: string) => void;
  dismissFinishedAlarm: (id: string) => void;
  snoozeFinishedAlarm: (id: string) => Promise<StartAlarmResult>;
  saveTimer: (label: string, durationMs: number) => void;
  removeSavedTimer: (id: string) => void;
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
  const [savedTimers, setSavedTimers] = useState<SavedTimer[]>([]);
  const [syncStopwatch, setSyncStopwatchState] = useState<boolean>(false);

  // Refs mirror state so event handlers and timers always see the latest values.
  const swRef = useRef<SwState>(INITIAL_SW);
  const alarmsRef = useRef<QuickAlarm[]>([]);
  const savedRef = useRef<SavedTimer[]>([]);
  const syncRef = useRef<boolean>(false);
  const hydratedRef = useRef<boolean>(false);
  const finishedRef = useRef<QuickAlarm[]>([]);
  const lastNotificationSecondRef = useRef<number | null>(null);

  const persistStopwatch = useCallback(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(STOPWATCH_KEY, JSON.stringify(swRef.current)).catch(() => {});
  }, []);

  const persistAlarms = useCallback(() => {
    if (!hydratedRef.current) return;
    AsyncStorage.setItem(
      ALARMS_KEY,
      JSON.stringify({ active: alarmsRef.current, saved: savedRef.current, syncStopwatch: syncRef.current }),
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

  // Latest finished list for snooze, without making the callback depend on it.
  useEffect(() => {
    finishedRef.current = finishedAlarms;
  }, [finishedAlarms]);

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
        setFinishedAlarms(expired.slice(-MAX_ACTIVE_ALARMS));
        savedRef.current = storedAlarms.saved;
        setSavedTimers(storedAlarms.saved);
        syncRef.current = storedAlarms.syncStopwatch;
        setSyncStopwatchState(storedAlarms.syncStopwatch);
      }
      hydratedRef.current = true;
    })();
    return () => {
      alive = false;
    };
  }, []);

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
    setFinishedAlarms((prev) => [...prev, ...expired].slice(-MAX_ACTIVE_ALARMS));
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const current = swRef.current;
    if (syncRef.current && current.running) {
      const total = elapsedMs(current, now);
      let laps = current.laps;
      for (const alarm of expired) {
        laps = [makeLap(laps, total, `⏰ ${alarm.label}`), ...laps];
      }
      commitSw({ ...current, laps });
    }
  }, [commitAlarms, commitSw]);

  // Wake exactly when the next countdown ends.
  useEffect(() => {
    if (alarms.length === 0) return;
    const next = Math.min(...alarms.map((alarm) => alarm.endAt));
    const timeout = setTimeout(sweepAlarms, Math.max(0, next - Date.now()) + 50);
    return () => clearTimeout(timeout);
  }, [alarms, sweepAlarms]);

  // Coming back to the app: timers were frozen, so catch up immediately.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      setSeconds(Math.floor(elapsedMs(swRef.current, Date.now()) / 1000));
      sweepAlarms();
    });
    return () => subscription.remove();
  }, [sweepAlarms]);

  /* ---------- Stopwatch actions ---------- */

  const startTimer = useCallback(() => {
    const current = swRef.current;
    if (current.running) return;
    commitSw({ ...current, running: true, startedAt: Date.now() });
  }, [commitSw]);

  const pauseTimer = useCallback(() => {
    const current = swRef.current;
    if (!current.running) return;
    commitSw({ ...current, running: false, baseMs: elapsedMs(current, Date.now()) });
  }, [commitSw]);

  const resetTimer = useCallback(() => {
    lastNotificationSecondRef.current = null;
    commitSw(INITIAL_SW);
  }, [commitSw]);

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
    async (durationMs: number, label?: string): Promise<StartAlarmResult> => {
      if (alarmsRef.current.length >= MAX_ACTIVE_ALARMS) return 'limit';
      if (!(await prepareQuickAlarmsAsync())) return 'unavailable';

      const alarm: QuickAlarm = {
        id: newAlarmId(),
        label: label?.trim() || defaultAlarmLabel(durationMs),
        durationMs,
        endAt: Date.now() + durationMs,
      };
      if (!(await scheduleQuickAlarmAsync(alarm.id, alarm.label, alarm.endAt))) return 'unavailable';

      // Another tap may have filled the last slot while permissions were shown.
      if (alarmsRef.current.length >= MAX_ACTIVE_ALARMS) {
        void cancelQuickAlarmAsync(alarm.id);
        return 'limit';
      }
      commitAlarms([...alarmsRef.current, alarm]);

      if (syncRef.current && !swRef.current.running) {
        commitSw({ ...swRef.current, running: true, startedAt: Date.now() });
      }
      return 'ok';
    },
    [commitAlarms, commitSw],
  );

  const cancelQuickAlarm = useCallback(
    (id: string) => {
      commitAlarms(alarmsRef.current.filter((alarm) => alarm.id !== id));
      void cancelQuickAlarmAsync(id);
    },
    [commitAlarms],
  );

  const dismissFinishedAlarm = useCallback((id: string) => {
    setFinishedAlarms((prev) => prev.filter((alarm) => alarm.id !== id));
    void cancelQuickAlarmAsync(id);
  }, []);

  const snoozeFinishedAlarm = useCallback(
    async (id: string): Promise<StartAlarmResult> => {
      const target = finishedRef.current.find((alarm) => alarm.id === id);
      if (!target) return 'ok';
      const result = await startQuickAlarm(SNOOZE_MS, target.label);
      if (result === 'ok') dismissFinishedAlarm(id);
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
        savedTimers,
        syncStopwatch,
        setSyncStopwatch,
        startQuickAlarm,
        cancelQuickAlarm,
        dismissFinishedAlarm,
        snoozeFinishedAlarm,
        saveTimer,
        removeSavedTimer,
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
