import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearRelationalData(): Promise<void> {
  await AsyncStorage.multiRemove([
    '@cashtrack/income',
    '@cashtrack/goals',
    '@cashtrack/goal-contributions',
    '@cashtrack/financial-reminders',
    '@cashtrack/reminder-payments',
  ]);
}
