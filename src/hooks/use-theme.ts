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
