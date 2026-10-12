import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type StopwatchContextType = {
  seconds: number;
  isRunning: boolean;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
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

  useEffect(() => {
    let interval: any = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((curr) => {
          const next = curr + 1;
          if (next % 5 === 0) {
            void updateNotification(next, true);
          }
          return next;
        });
      }, 1000);
      void updateNotification(0, true);
    } else {
      clearInterval(interval);
      void updateNotification(0, false);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const startTimer = () => {
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    if (NotificationsModule) {
      void NotificationsModule.dismissNotificationAsync(NOTIFICATION_ID);
    }
  };

  return (
    <StopwatchContext.Provider value={{ seconds, isRunning, startTimer, pauseTimer, resetTimer }}>
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
