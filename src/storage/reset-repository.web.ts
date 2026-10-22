import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEBTS_BACKUP_KEY } from './debt-storage';
import { EXPENSES_BACKUP_KEY } from './expense-storage';
import { clearNotes } from './notes-storage';

export async function clearAuxiliaryData(): Promise<void> {
  await clearNotes();
  await AsyncStorage.multiRemove([EXPENSES_BACKUP_KEY, DEBTS_BACKUP_KEY]);
}

export async function clearRelationalData(): Promise<void> {
  await AsyncStorage.multiRemove([
    '@cashtrack/income',
    '@cashtrack/goals',
    '@cashtrack/goal-contributions',
    '@cashtrack/financial-reminders',
    '@cashtrack/reminder-payments',
  ]);
}
