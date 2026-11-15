import { Platform } from 'react-native';

import { QUICK_ALARM_ID_PREFIX } from '@/utils/stopwatch';

/**
 * The one place the foreground notification handler is set. Expo keeps only
 * the last handler registered, so two copies would silently override each other.
 * Imported for its side effect by every module that schedules notifications.
 */
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async (notification: { request?: { identifier?: string } }) => {
        // Quick alarms ring inside the app (looping tone + vibration) while it
        // is open, so the system notification stays quiet to avoid a double sound.
        const quiet = (notification?.request?.identifier ?? '').startsWith(QUICK_ALARM_ID_PREFIX);
        return {
          shouldPlaySound: !quiet,
          shouldSetBadge: false,
          shouldShowBanner: !quiet,
          shouldShowList: !quiet,
        };
      },
    });
  } catch {
    // Expo Go / environments without notifications.
  }
}
