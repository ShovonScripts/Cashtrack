import { useContext } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ThemeModeContext } from '@/context/theme-context';
import { resolveThemeMode } from '@/utils/theme-mode';

export function useTheme() {
  const scheme = useColorScheme();
  const themeMode = useContext(ThemeModeContext);

  return Colors[resolveThemeMode(scheme, themeMode)];
}

/**
 * True when the app is drawing in dark mode (system setting or the user's
 * choice in Profile). Use this instead of comparing colour values, which
 * breaks whenever a palette colour is tuned.
 */
export function useIsDark(): boolean {
  const scheme = useColorScheme();
  const themeMode = useContext(ThemeModeContext);

  return resolveThemeMode(scheme, themeMode) === 'dark';
}
