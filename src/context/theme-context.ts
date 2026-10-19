import { createContext } from 'react';

import type { ThemeMode } from '@/types/preferences';

/**
 * Narrow context that carries only the user's theme preference.
 *
 * `useTheme` reads this instead of the whole `ExpenseContext`. Because the
 * provided value is a plain primitive that only changes when the preference
 * changes, theme-only consumers are no longer notified when unrelated expense or
 * preference state (budgets, categories, notifications, ...) is updated.
 */
export const ThemeModeContext = createContext<ThemeMode>('system');
