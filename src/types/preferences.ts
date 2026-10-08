import type { CountryCode } from '@/constants/countries';

export type GenderOption = 'woman' | 'man' | '';
export type ThemeMode = 'light' | 'dark' | 'system';
export type FirstDayOfWeek = 'monday' | 'sunday';

export type UserProfile = {
  name: string;
  age: number | null;
  gender: GenderOption;
  bio?: string;
  coverPhotoUri?: string;
  profilePhotoUri?: string;
};

export type UserPreferences = {
  profile: UserProfile;
  countryCode: CountryCode;
  customCategories: string[];
  /** Monthly spending caps, keyed by category name. */
  categoryLimits: Record<string, number>;
  /** Custom icons for categories, keyed by category name. */
  categoryIcons: Record<string, string>;
  notifiedThresholds: Record<string, string>;
  notifiedDebts: Record<string, string>;
  hasCompletedOnboarding: boolean;
  themeMode: ThemeMode;
  temperatureUnit: 'F' | 'C';
  firstDayOfWeek?: FirstDayOfWeek;
  enableBillReminders?: boolean;
  enableBudgetAlerts?: boolean;
  enableDailyReminder?: boolean;
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  profile: { name: '', age: null, gender: '', bio: '' },
  countryCode: 'BD',
  customCategories: [],
  categoryLimits: {},
  categoryIcons: {},
  notifiedThresholds: {},
  notifiedDebts: {},
  hasCompletedOnboarding: false,
  themeMode: 'system',
  temperatureUnit: 'F',
  firstDayOfWeek: 'monday',
  enableBillReminders: true,
  enableBudgetAlerts: true,
  enableDailyReminder: false,
};

