import { useContext } from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ExpenseContext } from '@/context/expense-context';

export function useTheme() {
  const scheme = useColorScheme();
  const expenseCtx = useContext(ExpenseContext);

  let mode: 'light' | 'dark' = scheme === 'dark' ? 'dark' : 'light';

  if (expenseCtx?.themeMode === 'dark') {
    mode = 'dark';
  } else if (expenseCtx?.themeMode === 'light') {
    mode = 'light';
  }

  return Colors[mode];
}
