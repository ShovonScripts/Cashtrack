import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function triggerHaptic(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(style).catch(() => {});
  }
}

export function triggerNotificationHaptic(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  if (Platform.OS !== 'web') {
    Haptics.notificationAsync(type).catch(() => {});
  }
}
