import type { ThemeMode } from '@/types/preferences';

/** The subset of react-native's `ColorSchemeName` this resolver cares about. */
export type ColorSchemePreference = 'light' | 'dark' | 'unspecified' | null | undefined;

/**
 * Resolves the concrete color mode from the OS scheme and the user's theme
 * preference. An explicit `light`/`dark` preference always wins; `system`
 * follows the OS scheme, falling back to light when the scheme is unknown.
 */
export function resolveThemeMode(
  scheme: ColorSchemePreference,
  preference: ThemeMode
): 'light' | 'dark' {
  if (preference === 'dark') return 'dark';
  if (preference === 'light') return 'light';
  return scheme === 'dark' ? 'dark' : 'light';
}

/**
 * The concrete mode a toggle should switch to next from the current preference.
 * `system` resolves to `dark` (the previous behaviour of the settings toggle).
 */
export function nextThemeMode(current: ThemeMode): 'light' | 'dark' {
  return current === 'dark' ? 'light' : 'dark';
}
