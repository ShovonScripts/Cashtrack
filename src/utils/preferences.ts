import { COUNTRIES } from '../constants/countries.ts';
import { StorageParseError } from '../storage/storage-errors.ts';
import { EXPENSE_CATEGORIES } from '../types/expense.ts';
import type { GenderOption, ThemeMode, UserPreferences } from '../types/preferences.ts';

const GENDER_OPTIONS: GenderOption[] = ['woman', 'man', 'other', ''];

function isUnsafeKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

function sanitizeNumberMap(value: unknown): Record<string, number> {
  const result: Record<string, number> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, entry] of Object.entries(value)) {
    if (isUnsafeKey(key)) continue;
    if (typeof entry === 'number' && Number.isFinite(entry) && entry > 0) {
      result[key] = entry;
    }
  }
  return result;
}

function sanitizeStringMap(value: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!value || typeof value !== 'object') return result;
  for (const [key, entry] of Object.entries(value)) {
    if (isUnsafeKey(key)) continue;
    if (typeof entry === 'string' && entry.trim().length > 0) {
      result[key] = entry.trim().slice(0, 64);
    }
  }
  return result;
}

export function sanitizePreferences(value: unknown): UserPreferences {
  if (typeof value !== 'object' || value === null) {
    throw new StorageParseError('Preferences payload is not an object');
  }
  const candidate = value as Partial<UserPreferences>;
  const rawProfile = candidate.profile && typeof candidate.profile === 'object'
    ? candidate.profile as Partial<UserPreferences['profile']>
    : {};
  const age = typeof rawProfile.age === 'number' && Number.isInteger(rawProfile.age) && rawProfile.age >= 1 && rawProfile.age <= 120
    ? rawProfile.age
    : null;
  const gender = GENDER_OPTIONS.includes(rawProfile.gender as GenderOption)
    ? rawProfile.gender as GenderOption
    : '';
  const builtIns = new Set<string>(EXPENSE_CATEGORIES.map((category) => category.toLowerCase()));
  const customCategories = Array.isArray(candidate.customCategories)
    ? [...new Set(candidate.customCategories
        .filter((category): category is string => typeof category === 'string')
        .map((category) => category.trim().slice(0, 28))
        .filter((category) => category.length > 0 && !builtIns.has(category.toLowerCase())))]
    : [];
  const categoryOrder = Array.isArray(candidate.categoryOrder)
    ? [...new Set(candidate.categoryOrder
        .filter((category): category is string => typeof category === 'string')
        .map((category) => category.trim().slice(0, 28))
        .filter((category) => category.length > 0))]
    : [];
  const categoryLimits = sanitizeNumberMap(candidate.categoryLimits);
  const categoryIcons = sanitizeStringMap(candidate.categoryIcons);
  const notifiedThresholds = sanitizeStringMap(candidate.notifiedThresholds);
  const notifiedDebts = sanitizeStringMap(candidate.notifiedDebts);

  const countryCode = COUNTRIES.find((country) => country.code === candidate.countryCode)?.code ?? 'BD';
  const hasCompletedOnboarding = typeof candidate.hasCompletedOnboarding === 'boolean'
    ? candidate.hasCompletedOnboarding
    : false;

  const themeMode: ThemeMode = candidate.themeMode === 'light' || candidate.themeMode === 'dark' || candidate.themeMode === 'system'
    ? candidate.themeMode
    : 'system';

  const temperatureUnit = candidate.temperatureUnit === 'C' || candidate.temperatureUnit === 'F'
    ? candidate.temperatureUnit
    : 'F';

  const coverPhotoUri = typeof rawProfile.coverPhotoUri === 'string' ? rawProfile.coverPhotoUri : undefined;
  const profilePhotoUri = typeof rawProfile.profilePhotoUri === 'string' ? rawProfile.profilePhotoUri : undefined;
  const bio = typeof rawProfile.bio === 'string' ? rawProfile.bio.slice(0, 150) : '';

  const firstDayOfWeek = candidate.firstDayOfWeek === 'sunday' ? 'sunday' : 'monday';
  const enableBillReminders = typeof candidate.enableBillReminders === 'boolean' ? candidate.enableBillReminders : true;
  const enableBudgetAlerts = typeof candidate.enableBudgetAlerts === 'boolean' ? candidate.enableBudgetAlerts : true;
  const enableDailyReminder = typeof candidate.enableDailyReminder === 'boolean' ? candidate.enableDailyReminder : false;
  const enableDailyQuotes = typeof candidate.enableDailyQuotes === 'boolean' ? candidate.enableDailyQuotes : false;
  const appLockEnabled = typeof candidate.appLockEnabled === 'boolean' ? candidate.appLockEnabled : false;
  const showExtras = typeof candidate.showExtras === 'boolean' ? candidate.showExtras : false;

  return {
    profile: {
      name: typeof rawProfile.name === 'string' ? rawProfile.name.slice(0, 50) : '',
      age,
      gender,
      bio,
      coverPhotoUri,
      profilePhotoUri,
    },
    countryCode,
    customCategories,
    categoryOrder,
    categoryLimits,
    categoryIcons,
    notifiedThresholds,
    notifiedDebts,
    hasCompletedOnboarding,
    themeMode,
    temperatureUnit,
    firstDayOfWeek,
    enableBillReminders,
    enableBudgetAlerts,
    enableDailyReminder,
    enableDailyQuotes,
    appLockEnabled,
    showExtras,
  };
}
