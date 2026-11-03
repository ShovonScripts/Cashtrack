import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}
