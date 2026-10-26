import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

type StopwatchContextType = {
  seconds: number;
  isRunning: boolean;
  laps: string[];
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  addLap: () => void;
  clearLaps: () => void;
};

const StopwatchContext = createContext<StopwatchContextType | undefined>(undefined);

const NOTIFICATION_ID = 'cashtrack-stopwatch-active';

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
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    const timeStr = `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (running) {
      await NotificationsModule.scheduleNotificationAsync({
        identifier: NOTIFICATION_ID,
        content: {
          title: '⏱️ CashTrack Stopwatch Running',
          body: `Elapsed time: ${timeStr}`,
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

export function StopwatchProvider({ children }: { children: React.ReactNode }) {
  const [seconds, setSeconds] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<string[]>([]);
  const elapsedBeforeStartRef = useRef<number>(0);
  const startedAtRef = useRef<number>(0);
  const lastNotificationSecondRef = useRef<number | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        // Recompute from the wall clock so timers blocked in the background
        // or throttled by the OS do not lose elapsed time. Keep this updater
        // pure: scheduling notifications here would run twice in StrictMode.
        setSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
      void updateNotification(0, true);
    } else {
      if (interval) clearInterval(interval);
      void updateNotification(0, false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || seconds <= 0 || seconds % 5 !== 0) return;
    if (lastNotificationSecondRef.current === seconds) return;
    lastNotificationSecondRef.current = seconds;
    void updateNotification(seconds, true);
  }, [isRunning, seconds]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const startTimer = () => {
    startedAtRef.current = Date.now() - elapsedBeforeStartRef.current * 1000;
    setIsRunning(true);
  };

  const pauseTimer = () => {
    const elapsed = Math.floor((Date.now() - startedAtRef.current) / 1000);
    elapsedBeforeStartRef.current = elapsed;
    setSeconds(elapsed);
    setIsRunning(false);
  };

  const resetTimer = () => {
    elapsedBeforeStartRef.current = 0;
    startedAtRef.current = Date.now();
    lastNotificationSecondRef.current = null;
    setIsRunning(false);
    setSeconds(0);
    setLaps([]);
    if (NotificationsModule) {
      void NotificationsModule.dismissNotificationAsync(NOTIFICATION_ID);
    }
  };

  const addLap = () => {
    const timeStr = formatTime(seconds);
    setLaps((curr) => [timeStr, ...curr]);
  };

  const clearLaps = () => {
    setLaps([]);
  };

  return (
    <StopwatchContext.Provider value={{ seconds, isRunning, laps, startTimer, pauseTimer, resetTimer, addLap, clearLaps }}>
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
