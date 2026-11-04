import { Platform, Vibration } from 'react-native';

type Player = { loop: boolean; volume: number; play: () => void; pause: () => void; remove: () => void };

let player: Player | null = null;
/** True from startRinging until stopRinging, so a stop that arrives mid-setup wins. */
let wanted = false;

const VIBRATION_PATTERN = [0, 800, 400, 800, 400, 800, 1200];

/**
 * Rings like a phone alarm while the app is open: the tone loops and the phone
 * vibrates in a repeating pattern until stopRinging() is called.
 */
export async function startRinging(): Promise<void> {
  if (wanted) return;
  wanted = true;

  if (Platform.OS !== 'web') Vibration.vibrate(VIBRATION_PATTERN, true);
  if (Platform.OS === 'web') return;

  try {
    // Loaded lazily so a build without the native module still runs.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createAudioPlayer, setAudioModeAsync } = require('expo-audio');
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      interruptionModeAndroid: 'doNotMix',
    });
    if (!wanted) return;

    const next: Player = createAudioPlayer(require('../../assets/sounds/alarm_loop.wav'));
    next.loop = true;
    next.volume = 1;
    if (!wanted) {
      next.remove();
      return;
    }
    player = next;
    next.play();
  } catch {
    // No audio module (Expo Go / old build): vibration and the notification still work.
  }
}

export function stopRinging(): void {
  wanted = false;
  if (Platform.OS !== 'web') Vibration.cancel();
  const current = player;
  player = null;
  if (!current) return;
  try {
    current.pause();
    current.remove();
  } catch {}
}
