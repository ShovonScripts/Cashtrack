import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Platform } from 'react-native';

import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { getCountry, type CountryCode, type CountryOption } from '@/constants/countries';
import { formatCurrency } from '@/utils/expense';
import { mergeExpenseChanges } from '@/utils/expense-draft';
import { DEFAULT_PREFERENCES, type UserPreferences, type UserProfile } from '@/types/preferences';
import { loadExpenses, saveExpenses } from '@/storage/expense-storage';
import { loadPreferences, savePreferences } from '@/storage/preferences-storage';
import { clearRelationalData } from '@/storage/reset-repository';
import { createSeedExpenses } from '@/data/seed-expenses';
import { processRecurringExpenses } from '@/utils/recurring';
import { checkAndTriggerBudgetNotifications } from '@/utils/notifications';
import { deleteLocalReceipt } from '@/utils/receipt';
import { SaveQueue, shouldSave } from '@/utils/save-queue';
import { ResetRegistry } from '../utils/reset-registry.ts';

let NotificationsModule: any = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    NotificationsModule = require('expo-notifications');
  } catch {}
}

type ExpenseAction =
  | { type: 'HYDRATE'; expenses: Expense[] }
  | { type: 'ADD_EXPENSE'; expense: Expense }
  | { type: 'UPDATE_EXPENSE'; id: string; changes: ExpenseDraft }
  | { type: 'DELETE_EXPENSE'; id: string }
  | { type: 'RENAME_CATEGORY'; from: string; to: string };

function expenseReducer(state: Expense[], action: ExpenseAction): Expense[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.expenses;
    case 'ADD_EXPENSE':
      return [action.expense, ...state];
    case 'UPDATE_EXPENSE':
      return state.map((expense) => expense.id === action.id
        ? mergeExpenseChanges(expense, action.changes)
        : expense);
    case 'DELETE_EXPENSE':
      return state.filter((expense) => expense.id !== action.id);
    case 'RENAME_CATEGORY':
      return state.map((expense) => expense.category === action.from
        ? { ...expense, category: action.to }
        : expense);
    default:
      return state;
  }
}

let idCounter = 0;

function createId(): string {
  idCounter += 1;
  return `expense-${Date.now().toString(36)}-${idCounter}`;
}

export type DeleteCategoryResult = 'deleted' | 'in-use' | 'not-custom';

type ExpenseContextValue = {
  expenses: Expense[];
  isLoading: boolean;
  dataLoadError: boolean;
  profile: UserProfile;
  country: CountryOption;
  formatAmount: (amount: number) => string;
  categories: ExpenseCategory[];
  customCategories: string[];
  categoryLimits: Record<string, number>;
  categoryIcons: Record<string, string>;
  notifiedDebts: Record<string, string>;
  updateNotifiedDebts: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  registerResetHandler: (handler: () => Promise<void>) => () => void;
  addExpense: (draft: ExpenseDraft) => Expense;
  updateExpense: (id: string, changes: ExpenseDraft) => void;
  deleteExpense: (id: string) => void;
  getExpense: (id: string) => Expense | undefined;
  updateProfile: (profile: UserProfile) => void;
  setCountryCode: (countryCode: CountryCode) => void;
  addCategory: (name: string, icon?: string) => boolean;
  renameCategory: (from: string, to: string) => boolean;
  deleteCategory: (name: string) => DeleteCategoryResult;
  setCategoryLimit: (category: string, limit: number | null) => void;
  setCategoryIcon: (category: string, icon: string) => void;
  hasCompletedOnboarding: boolean;
  setHasCompletedOnboarding: (completed: boolean) => void;
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleThemeMode: () => void;
  temperatureUnit: 'F' | 'C';
  setTemperatureUnit: (unit: 'F' | 'C') => void;
  firstDayOfWeek: 'monday' | 'sunday';
  setFirstDayOfWeek: (day: 'monday' | 'sunday') => void;
  enableBillReminders: boolean;
  setEnableBillReminders: (enabled: boolean) => void;
  enableBudgetAlerts: boolean;
  setEnableBudgetAlerts: (enabled: boolean) => void;
  enableDailyReminder: boolean;
  setEnableDailyReminder: (enabled: boolean) => void;
  resetAllData: () => Promise<void>;
};

export const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(expenseReducer, []);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(false);

  const expenseLoadFailedRef = useRef(false);
  const preferencesLoadFailedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastSavedExpensesRef = useRef<string>('');
  const lastSavedPreferencesRef = useRef<string>('');
  const expenseSaveQueue = useRef(new SaveQueue());
  const preferencesSaveQueue = useRef(new SaveQueue());
  const resetRegistryRef = useRef(new ResetRegistry());
  const expensesRef = useRef(expenses);
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);

  const registerResetHandler = useCallback((handler: () => Promise<void>) => {
    return resetRegistryRef.current.register(handler);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let expenseFailed = false;
      let prefFailed = false;

      const [savedExpenses, savedPreferences] = await Promise.all([
        loadExpenses().catch((err) => {
          expenseFailed = true;
          console.error('[cashtrack] Failed to load expenses', err);
          return null;
        }),
        loadPreferences().catch((err) => {
          prefFailed = true;
          console.error('[cashtrack] Failed to load preferences', err);
          return null;
        }),
      ]);

      if (cancelled) return;

      expenseLoadFailedRef.current = expenseFailed;
      preferencesLoadFailedRef.current = prefFailed;
      setDataLoadError(expenseFailed || prefFailed);

      const rawInitial = expenseFailed ? [] : (savedExpenses ?? (__DEV__ ? createSeedExpenses() : []));
      const initialExpenses = processRecurringExpenses(rawInitial);
      const basePreferences = prefFailed || !savedPreferences ? DEFAULT_PREFERENCES : savedPreferences;

      // Prune notifiedDebts older than 30 days without mutating DEFAULT_PREFERENCES
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const prunedNotifiedDebts: Record<string, string> = {};
      const sourceNotifiedDebts = basePreferences.notifiedDebts || {};
      for (const [key, dateStr] of Object.entries(sourceNotifiedDebts)) {
        const d = new Date(dateStr).getTime();
        if (!Number.isNaN(d) && d >= thirtyDaysAgo) {
          prunedNotifiedDebts[key] = dateStr;
        }
      }

      const initialPreferences: UserPreferences = {
        ...basePreferences,
        notifiedDebts: prunedNotifiedDebts,
      };

      dispatch({ type: 'HYDRATE', expenses: initialExpenses });
      setPreferences(initialPreferences);
      lastSavedExpensesRef.current = JSON.stringify(savedExpenses ?? []);
      lastSavedPreferencesRef.current = JSON.stringify(savedPreferences ?? DEFAULT_PREFERENCES);
      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    void hydrate();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const currentJson = JSON.stringify(expenses);
    if (shouldSave({ hasLoaded: hasLoadedRef.current, loadFailed: expenseLoadFailedRef.current, currentJson, lastSavedJson: lastSavedExpensesRef.current })) {
      void expenseSaveQueue.current.enqueue(() => saveExpenses(expenses)).then((success) => {
        if (success) {
          lastSavedExpensesRef.current = currentJson;
        }
      });
    }
  }, [expenses]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const currentJson = JSON.stringify(preferences);
    if (shouldSave({ hasLoaded: hasLoadedRef.current, loadFailed: preferencesLoadFailedRef.current, currentJson, lastSavedJson: lastSavedPreferencesRef.current })) {
      void preferencesSaveQueue.current.enqueue(() => savePreferences(preferences)).then((success) => {
        if (success) {
          lastSavedPreferencesRef.current = currentJson;
        }
      });
    }
  }, [preferences]);

  useEffect(() => {
    if (hasLoadedRef.current && !expenseLoadFailedRef.current) {
      void checkAndTriggerBudgetNotifications({
        expenses,
        limits: preferences.categoryLimits,
        notifiedThresholds: preferences.notifiedThresholds,
        onThresholdNotified: (key, level) => {
          setPreferences((current) => ({
            ...current,
            notifiedThresholds: { ...current.notifiedThresholds, [key]: level },
          }));
        },
      });
    }
  }, [expenses, preferences.categoryLimits, preferences.notifiedThresholds]);

  const updateNotifiedDebts = useCallback((updater: (current: Record<string, string>) => Record<string, string>) => {
    setPreferences((current) => ({
      ...current,
      notifiedDebts: updater(current.notifiedDebts || {}),
    }));
  }, []);

  const addExpense = useCallback((draft: ExpenseDraft): Expense => {
    const expense: Expense = {
      ...draft,
      id: createId(),
      date: draft.date ?? new Date().toISOString(),
      isRecurring: draft.isRecurring ?? false,
      recurringFrequency: draft.recurringFrequency,
      recurringEndDate: draft.recurringEndDate,
    };
    dispatch({ type: 'ADD_EXPENSE', expense });
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, changes: ExpenseDraft) => {
    dispatch({ type: 'UPDATE_EXPENSE', id, changes });
  }, []);

  const deleteExpense = useCallback((id: string) => {
    dispatch({ type: 'DELETE_EXPENSE', id });
  }, []);

  const getExpense = useCallback(
    (id: string) => expenses.find((expense) => expense.id === id),
    [expenses]
  );

  const updateProfile = useCallback((profile: UserProfile) => {
    setPreferences((current) => ({ ...current, profile }));
  }, []);

  const setCountryCode = useCallback((countryCode: CountryCode) => {
    setPreferences((current) => ({ ...current, countryCode }));
  }, []);

  const country = useMemo(() => getCountry(preferences.countryCode), [preferences.countryCode]);
  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, country.currencyCode),
    [country.currencyCode]
  );

  const categories = useMemo(() => [
    ...new Set<ExpenseCategory>([
      ...EXPENSE_CATEGORIES,
      ...preferences.customCategories,
      ...expenses.map((expense) => expense.category),
    ]),
  ], [expenses, preferences.customCategories]);

  const addCategory = useCallback((rawName: string, icon?: string): boolean => {
    const name = rawName.trim().slice(0, 28);
    if (!name || categories.some((category) => category.toLowerCase() === name.toLowerCase())) return false;
    setPreferences((current) => ({
      ...current,
      customCategories: [...current.customCategories, name],
      categoryIcons: icon ? { ...current.categoryIcons, [name]: icon } : current.categoryIcons,
    }));
    return true;
  }, [categories]);

  const renameCategory = useCallback((from: string, rawName: string): boolean => {
    const to = rawName.trim().slice(0, 28);
    if (!to || from === to || categories.some((category) => category.toLowerCase() === to.toLowerCase())) return false;
    if (!preferences.customCategories.includes(from)) return false;

    dispatch({ type: 'RENAME_CATEGORY', from, to });
    setPreferences((current) => {
      const nextLimits = { ...current.categoryLimits };
      if (nextLimits[from] !== undefined) {
        nextLimits[to] = nextLimits[from];
        delete nextLimits[from];
      }
      const nextIcons = { ...current.categoryIcons };
      if (nextIcons[from] !== undefined) {
        nextIcons[to] = nextIcons[from];
        delete nextIcons[from];
      }
      return {
        ...current,
        customCategories: current.customCategories.map((category) => category === from ? to : category),
        categoryLimits: nextLimits,
        categoryIcons: nextIcons,
      };
    });
    return true;
  }, [categories, preferences.customCategories]);

  const deleteCategory = useCallback((name: string): DeleteCategoryResult => {
    if (!preferences.customCategories.includes(name)) return 'not-custom';
    if (expenses.some((expense) => expense.category === name)) return 'in-use';
    setPreferences((current) => {
      const categoryLimits = { ...current.categoryLimits };
      delete categoryLimits[name];
      const categoryIcons = { ...current.categoryIcons };
      delete categoryIcons[name];
      return {
        ...current,
        customCategories: current.customCategories.filter((category) => category !== name),
        categoryLimits,
        categoryIcons,
      };
    });
    return 'deleted';
  }, [expenses, preferences.customCategories]);

  const setCategoryLimit = useCallback((category: string, limit: number | null) => {
    setPreferences((current) => {
      const categoryLimits = { ...current.categoryLimits };
      if (limit === null || !Number.isFinite(limit) || limit <= 0) {
        delete categoryLimits[category];
      } else {
        categoryLimits[category] = limit;
      }
      return { ...current, categoryLimits };
    });
  }, []);

  const setCategoryIcon = useCallback((category: string, icon: string) => {
    setPreferences((current) => ({
      ...current,
      categoryIcons: { ...current.categoryIcons, [category]: icon },
    }));
  }, []);

  const setHasCompletedOnboarding = useCallback((completed: boolean) => {
    setPreferences((current) => ({ ...current, hasCompletedOnboarding: completed }));
  }, []);

  const setThemeMode = useCallback((mode: 'light' | 'dark' | 'system') => {
    setPreferences((current) => ({ ...current, themeMode: mode }));
  }, []);

  const toggleThemeMode = useCallback(() => {
    setPreferences((current) => ({
      ...current,
      themeMode: current.themeMode === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  const setTemperatureUnit = useCallback((unit: 'F' | 'C') => {
    setPreferences((current) => ({ ...current, temperatureUnit: unit }));
  }, []);

  const setFirstDayOfWeek = useCallback((day: 'monday' | 'sunday') => {
    setPreferences((current) => ({ ...current, firstDayOfWeek: day }));
  }, []);

  const setEnableBillReminders = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, enableBillReminders: enabled }));
  }, []);

  const setEnableBudgetAlerts = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, enableBudgetAlerts: enabled }));
  }, []);

  const setEnableDailyReminder = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, enableDailyReminder: enabled }));
  }, []);

  const resetAllData = useCallback(async () => {
    // a. Snapshot receiptUris
    const receiptUris = expensesRef.current.filter((e) => e.receiptUri).map((e) => e.receiptUri!);

    // b. Await clearRelationalData and queue writes; throw if any fails
    const expRes = await expenseSaveQueue.current.enqueue(() => saveExpenses([]));
    if (!expRes) throw new Error('Failed to save empty expenses during reset');
    const prefRes = await preferencesSaveQueue.current.enqueue(() => savePreferences(DEFAULT_PREFERENCES));
    if (!prefRes) throw new Error('Failed to save default preferences during reset');

    await clearRelationalData();

    // c. Await registry.runAll()
    await resetRegistryRef.current.runAll();

    // d. Reset expense/preference memory, clear loadFailed refs and dataLoadError, set lastSaved refs
    expenseLoadFailedRef.current = false;
    preferencesLoadFailedRef.current = false;
    setDataLoadError(false);

    dispatch({ type: 'HYDRATE', expenses: [] });
    setPreferences(DEFAULT_PREFERENCES);
    lastSavedExpensesRef.current = JSON.stringify([]);
    lastSavedPreferencesRef.current = JSON.stringify(DEFAULT_PREFERENCES);

    // e. Delete snapshotted receipt files and cancel notifications
    for (const uri of receiptUris) {
      try {
        await deleteLocalReceipt(uri);
      } catch (error) {
        console.error('[cashtrack] Failed to delete receipt during reset', error);
      }
    }

    if (NotificationsModule) {
      try {
        await NotificationsModule.cancelAllScheduledNotificationsAsync();
      } catch {}
    }
  }, []);

  const value = useMemo(() => ({
    expenses,
    isLoading,
    dataLoadError,
    profile: preferences.profile,
    country,
    formatAmount,
    categories,
    customCategories: preferences.customCategories,
    categoryLimits: preferences.categoryLimits,
    categoryIcons: preferences.categoryIcons,
    notifiedDebts: preferences.notifiedDebts || {},
    updateNotifiedDebts,
    registerResetHandler,
    hasCompletedOnboarding: preferences.hasCompletedOnboarding ?? false,
    setHasCompletedOnboarding,
    themeMode: preferences.themeMode ?? 'system',
    setThemeMode,
    toggleThemeMode,
    temperatureUnit: preferences.temperatureUnit ?? 'F',
    setTemperatureUnit,
    firstDayOfWeek: preferences.firstDayOfWeek ?? 'monday',
    setFirstDayOfWeek,
    enableBillReminders: preferences.enableBillReminders ?? true,
    setEnableBillReminders,
    enableBudgetAlerts: preferences.enableBudgetAlerts ?? true,
    setEnableBudgetAlerts,
    enableDailyReminder: preferences.enableDailyReminder ?? false,
    setEnableDailyReminder,
    resetAllData,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    updateProfile,
    setCountryCode,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryLimit,
    setCategoryIcon,
  }), [
    expenses,
    isLoading,
    dataLoadError,
    preferences,
    categories,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    updateProfile,
    setCountryCode,
    country,
    formatAmount,
    addCategory,
    renameCategory,
    deleteCategory,
    setCategoryLimit,
    setCategoryIcon,
    setHasCompletedOnboarding,
    setThemeMode,
    toggleThemeMode,
    setTemperatureUnit,
    setFirstDayOfWeek,
    setEnableBillReminders,
    setEnableBudgetAlerts,
    setEnableDailyReminder,
    resetAllData,
    updateNotifiedDebts,
    registerResetHandler,
  ]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used inside an <ExpenseProvider>');
  return context;
}
