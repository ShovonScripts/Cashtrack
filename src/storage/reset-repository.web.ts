import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_STORAGE_PREFIXES = ['@cashtrack', '@spendly'];

export async function clearAuxiliaryData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const removable = keys.filter((key) => APP_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix)));
  if (removable.length > 0) {
    await AsyncStorage.multiRemove(removable);
  }
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
