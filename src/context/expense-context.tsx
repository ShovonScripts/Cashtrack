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
import { AppState, Platform } from 'react-native';

import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory, type ExpenseDraft } from '@/types/expense';
import { getCountry, type CountryCode, type CountryOption } from '@/constants/countries';
import { formatCurrency } from '@/utils/expense';
import { mergeExpenseChanges } from '@/utils/expense-draft';
import { DEFAULT_PREFERENCES, type UserPreferences, type UserProfile } from '@/types/preferences';
import { backupUnreadableExpenses, loadExpenses, saveExpenses } from '@/storage/expense-storage';
import { backupUnreadablePreferences, loadPreferences, savePreferences } from '@/storage/preferences-storage';
import { loadAppLockFlag, saveAppLockFlag } from '@/storage/app-lock-storage';
import { StorageParseError } from '@/storage/storage-errors';
import { ThemeModeContext } from '@/context/theme-context';
import { nextThemeMode } from '@/utils/theme-mode';
import { clearAuxiliaryData, clearRelationalData } from '@/storage/reset-repository';
import { createSeedExpenses } from '@/data/seed-expenses';
import { getRecurringPeriodKey, processRecurringExpenses } from '@/utils/recurring';
import { clearRecurringSkips, loadRecurringSkips, skipRecurringPeriod } from '@/storage/recurring-skips';
import { checkAndTriggerBudgetNotifications } from '@/utils/notifications';
import { deleteLocalFile } from '@/utils/local-file';
import { deleteLocalReceipt } from '@/utils/receipt';
import { SaveQueue, shouldSave } from '@/utils/save-queue';
import { resolveInitialAppLockEnabled } from '@/utils/app-lock';
import {
  applyCategoryOrder,
  moveCategoryInOrder,
  type CategoryMoveDirection,
} from '@/utils/category-order';
import { ResetRegistry } from '../utils/reset-registry.ts';
import { clearRestoreJournal } from '@/storage/restore-journal';
import { clearStoresInSafeOrder } from '@/utils/reset-stores';

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
      return state.filter(
        (expense) => expense.id !== action.id && expense.recurringParentId !== action.id
      );
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

/**
 * Expense data and lifecycle only. Kept separate from preferences so changing a
 * setting (theme, currency, reminder toggle) does not re-render every screen that
 * merely reads the expense ledger.
 */
type ExpenseContextValue = {
  expenses: Expense[];
  isLoading: boolean;
  dataLoadError: boolean;
  dataRecovered: boolean;
  saveError: boolean;
  retrySave: () => void;
  registerResetHandler: (handler: () => Promise<void>) => () => void;
  addExpense: (draft: ExpenseDraft) => Expense;
  updateExpense: (id: string, changes: ExpenseDraft) => void;
  deleteExpense: (id: string) => Promise<void>;
  getExpense: (id: string) => Expense | undefined;
  resetAllData: () => Promise<void>;
  reloadAllData: () => void;
};

/** User preferences, profile, categories and settings. */
type PreferencesContextValue = {
  preferences: UserPreferences;
  profile: UserProfile;
  country: CountryOption;
  formatAmount: (amount: number) => string;
  categories: ExpenseCategory[];
  customCategories: string[];
  categoryLimits: Record<string, number>;
  categoryIcons: Record<string, string>;
  notifiedDebts: Record<string, string>;
  updateNotifiedDebts: (updater: (current: Record<string, string>) => Record<string, string>) => void;
  updateProfile: (profile: UserProfile) => Promise<boolean>;
  setCountryCode: (countryCode: CountryCode) => void;
  addCategory: (name: string, icon?: string) => boolean;
  renameCategory: (from: string, to: string) => boolean;
  deleteCategory: (name: string) => DeleteCategoryResult;
  moveCategory: (name: string, direction: CategoryMoveDirection) => boolean;
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
  enableDailyQuotes: boolean;
  setEnableDailyQuotes: (enabled: boolean) => void;
  appLockEnabled: boolean;
  setAppLockEnabled: (enabled: boolean) => void;
};

export const ExpenseContext = createContext<ExpenseContextValue | undefined>(undefined);
export const PreferencesContext = createContext<PreferencesContextValue | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, dispatch] = useReducer(expenseReducer, []);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoadError, setDataLoadError] = useState(false);
  const [dataRecovered, setDataRecovered] = useState(false);
  const [expensesSaveError, setExpensesSaveError] = useState(false);
  const [preferencesSaveError, setPreferencesSaveError] = useState(false);
  const [saveRetryToken, setSaveRetryToken] = useState(0);
  const [loadToken, setLoadToken] = useState(0);

  const expenseLoadFailedRef = useRef(false);
  const preferencesLoadFailedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastSavedExpensesRef = useRef<string>('');
  const lastSavedPreferencesRef = useRef<string>('');
  const expenseSaveQueue = useRef(new SaveQueue());
  const preferencesSaveQueue = useRef(new SaveQueue());
  const resetRegistryRef = useRef(new ResetRegistry());
  const expensesRef = useRef(expenses);
  const preferencesRef = useRef(preferences);
  const skippedPeriodsRef = useRef<Record<string, ReadonlySet<string>>>({});
  useEffect(() => {
    expensesRef.current = expenses;
  }, [expenses]);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && hasLoadedRef.current) {
        const current = expensesRef.current;
        const processed = processRecurringExpenses(current, skippedPeriodsRef.current);
        if (processed.length !== current.length) {
          expensesRef.current = processed;
          dispatch({ type: 'HYDRATE', expenses: processed });
        }
      }
    });
    return () => subscription.remove();
  }, []);

  const registerResetHandler = useCallback((handler: () => Promise<void>) => {
    return resetRegistryRef.current.register(handler);
  }, []);

  const reloadAllData = useCallback(() => {
    setLoadToken((token) => token + 1);
  }, []);

  /** Re-attempt any writes that failed while the app stayed open. */
  const retrySave = useCallback(() => {
    setSaveRetryToken((token) => token + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let expenseFailed = false;
      let prefFailed = false;
      let expenseRecovered = false;
      let prefRecovered = false;

      const [savedExpenses, savedPreferences, storedAppLock] = await Promise.all([
        loadExpenses().catch(async (err) => {
          if (err instanceof StorageParseError && (await backupUnreadableExpenses())) {
            expenseRecovered = true;
            console.warn('[cashtrack] Expenses were unreadable; original payload backed up');
            return null;
          }
          expenseFailed = true;
          console.error('[cashtrack] Failed to load expenses', err);
          return null;
        }),
        loadPreferences().catch(async (err) => {
          if (err instanceof StorageParseError && (await backupUnreadablePreferences())) {
            prefRecovered = true;
            console.warn('[cashtrack] Preferences were unreadable; original payload backed up');
            return null;
          }
          prefFailed = true;
          console.error('[cashtrack] Failed to load preferences', err);
          return null;
        }),
        loadAppLockFlag().catch((err) => {
          console.error('[cashtrack] Failed to load the App Lock setting', err);
          return undefined;
        }),
      ]);

      const skippedPeriods = await loadRecurringSkips('expense').catch(() => ({}));
      if (cancelled) return;
      skippedPeriodsRef.current = skippedPeriods;

      expenseLoadFailedRef.current = expenseFailed;
      preferencesLoadFailedRef.current = prefFailed;
      setDataLoadError(expenseFailed || prefFailed);
      setDataRecovered(expenseRecovered || prefRecovered);

      const rawInitial = expenseFailed ? [] : (savedExpenses ?? (__DEV__ ? createSeedExpenses() : []));
      const initialExpenses = processRecurringExpenses(rawInitial, skippedPeriods);
      const basePreferences = prefFailed || !savedPreferences ? DEFAULT_PREFERENCES : savedPreferences;
      const appLockEnabled = resolveInitialAppLockEnabled(
        storedAppLock,
        savedPreferences?.appLockEnabled ?? false,
        prefFailed,
      );

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
        appLockEnabled,
        notifiedDebts: prunedNotifiedDebts,
      };

      if ((storedAppLock === null || storedAppLock === undefined) && !prefFailed) {
        void saveAppLockFlag(appLockEnabled).catch((error) => {
          console.error('[cashtrack] Failed to migrate the App Lock setting', error);
        });
      }

      expensesRef.current = initialExpenses;
      preferencesRef.current = initialPreferences;
      dispatch({ type: 'HYDRATE', expenses: initialExpenses });
      setPreferences(initialPreferences);
      lastSavedExpensesRef.current = JSON.stringify(savedExpenses ?? []);
      lastSavedPreferencesRef.current = JSON.stringify(savedPreferences ?? DEFAULT_PREFERENCES);
      hasLoadedRef.current = true;
      setExpensesSaveError(false);
      setPreferencesSaveError(false);
      setIsLoading(false);
    }

    void hydrate();
    return () => { cancelled = true; };
  }, [loadToken]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const currentJson = JSON.stringify(expenses);
    if (shouldSave({ hasLoaded: hasLoadedRef.current, loadFailed: expenseLoadFailedRef.current, currentJson, lastSavedJson: lastSavedExpensesRef.current })) {
      void expenseSaveQueue.current.enqueueDetailed(() => saveExpenses(expenses)).then((outcome) => {
        if (outcome === 'saved') {
          lastSavedExpensesRef.current = currentJson;
          setExpensesSaveError(false);
        } else if (outcome === 'failed') {
          setExpensesSaveError(true);
        }
      });
    }
  }, [expenses, saveRetryToken]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const currentJson = JSON.stringify(preferences);
    if (shouldSave({ hasLoaded: hasLoadedRef.current, loadFailed: preferencesLoadFailedRef.current, currentJson, lastSavedJson: lastSavedPreferencesRef.current })) {
      void preferencesSaveQueue.current.enqueueDetailed(() => savePreferences(preferences)).then((outcome) => {
        if (outcome === 'saved') {
          lastSavedPreferencesRef.current = currentJson;
          setPreferencesSaveError(false);
        } else if (outcome === 'failed') {
          setPreferencesSaveError(true);
        }
      });
    }
  }, [preferences, saveRetryToken]);

  useEffect(() => {
    if (
      hasLoadedRef.current &&
      !expenseLoadFailedRef.current &&
      (preferences.enableBudgetAlerts ?? true)
    ) {
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
  }, [
    expenses,
    preferences.categoryLimits,
    preferences.notifiedThresholds,
    preferences.enableBudgetAlerts,
  ]);

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
    const current = expensesRef.current;
    const nextList = [expense, ...current];
    const processed = processRecurringExpenses(nextList, skippedPeriodsRef.current);
    // Keep the ref in sync immediately so two adds in one tick cannot clobber
    // each other before the render effect runs.
    expensesRef.current = processed;
    dispatch({ type: 'HYDRATE', expenses: processed });
    return expense;
  }, []);

  const updateExpense = useCallback((id: string, changes: ExpenseDraft) => {
    expensesRef.current = expensesRef.current.map((expense) => (
      expense.id === id ? mergeExpenseChanges(expense, changes) : expense
    ));
    dispatch({ type: 'UPDATE_EXPENSE', id, changes });
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const current = expensesRef.current;
    const target = current.find((expense) => expense.id === id);
    const parent = target?.recurringParentId
      ? current.find((expense) => expense.id === target.recurringParentId)
      : undefined;

    if (target?.recurringParentId && parent?.recurringFrequency) {
      const periodKey = getRecurringPeriodKey(new Date(target.date), parent.recurringFrequency);
      try {
        await skipRecurringPeriod('expense', parent.id, periodKey);
      } catch (error) {
        console.error('[cashtrack] Failed to remember deleted recurring expense', error);
      }
    }

    // Deleting a recurring template removes every occurrence it generated, so
    // orphaned instances cannot linger in lists or totals.
    const removed = current.filter(
      (expense) => expense.id === id || expense.recurringParentId === id
    );

    expensesRef.current = current.filter(
      (expense) => expense.id !== id && expense.recurringParentId !== id
    );
    dispatch({ type: 'DELETE_EXPENSE', id });

    for (const expense of removed) {
      if (expense.receiptUri) {
        await deleteLocalReceipt(expense.receiptUri);
      }
    }
  }, []);

  const getExpense = useCallback(
    (id: string) => expenses.find((expense) => expense.id === id),
    [expenses]
  );

  const updateProfile = useCallback(async (profile: UserProfile): Promise<boolean> => {
    if (!hasLoadedRef.current || preferencesLoadFailedRef.current) return false;

    const nextPreferences = { ...preferencesRef.current, profile };
    const nextJson = JSON.stringify(nextPreferences);
    const previousJson = lastSavedPreferencesRef.current;

    preferencesRef.current = nextPreferences;
    lastSavedPreferencesRef.current = nextJson;
    setPreferences(nextPreferences);

    const success = await preferencesSaveQueue.current.enqueue(() => savePreferences(nextPreferences));
    if (!success) {
      lastSavedPreferencesRef.current = previousJson;
    }
    setPreferencesSaveError(!success);
    return success;
  }, []);

  const setCountryCode = useCallback((countryCode: CountryCode) => {
    setPreferences((current) => ({ ...current, countryCode }));
  }, []);

  const country = useMemo(() => getCountry(preferences.countryCode), [preferences.countryCode]);
  const formatAmount = useCallback(
    (amount: number) => formatCurrency(amount, country.currencyCode),
    [country.currencyCode]
  );

  const defaultCategories = useMemo(() => [
    ...new Set<ExpenseCategory>([
      ...EXPENSE_CATEGORIES,
      ...preferences.customCategories,
      ...expenses.map((expense) => expense.category),
    ]),
  ], [expenses, preferences.customCategories]);

  const categories = useMemo(
    () => applyCategoryOrder(defaultCategories, preferences.categoryOrder),
    [defaultCategories, preferences.categoryOrder],
  );

  const addCategory = useCallback((rawName: string, icon?: string): boolean => {
    const name = rawName.trim().slice(0, 28);
    if (!name || categories.some((category) => category.toLowerCase() === name.toLowerCase())) return false;
    setPreferences((current) => ({
      ...current,
      customCategories: [...current.customCategories, name],
      categoryOrder: [...categories, name],
      categoryIcons: icon ? { ...current.categoryIcons, [name]: icon } : current.categoryIcons,
    }));
    return true;
  }, [categories]);

  const renameCategory = useCallback((from: string, rawName: string): boolean => {
    const to = rawName.trim().slice(0, 28);
    if (!to || from === to || categories.some((category) => category.toLowerCase() === to.toLowerCase())) return false;
    if (!preferences.customCategories.includes(from)) return false;

    expensesRef.current = expensesRef.current.map((expense) => (
      expense.category === from ? { ...expense, category: to } : expense
    ));
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
        categoryOrder: categories.map((category) => category === from ? to : category),
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
        categoryOrder: categories.filter((category) => category !== name),
        categoryLimits,
        categoryIcons,
      };
    });
    return 'deleted';
  }, [categories, expenses, preferences.customCategories]);

  const moveCategory = useCallback((name: string, direction: CategoryMoveDirection): boolean => {
    const next = moveCategoryInOrder(categories, name as ExpenseCategory, direction);
    if (next === categories) return false;
    setPreferences((current) => ({ ...current, categoryOrder: next }));
    return true;
  }, [categories]);

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
      themeMode: nextThemeMode(current.themeMode ?? 'system'),
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

  const setEnableDailyQuotes = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, enableDailyQuotes: enabled }));
  }, []);

  const setAppLockEnabled = useCallback((enabled: boolean) => {
    setPreferences((current) => ({ ...current, appLockEnabled: enabled }));
  }, []);

  const resetAllData = useCallback(async () => {
    // a. Snapshot receiptUris and profile images
    const receiptUris = expensesRef.current.filter((e) => e.receiptUri).map((e) => e.receiptUri!);
    const profileImageUris = [
      preferencesRef.current.profile.coverPhotoUri,
      preferencesRef.current.profile.profilePhotoUri,
    ].filter((uri): uri is string => Boolean(uri));

    // a. Drop the pending-restore journal, let providers finish in-flight
    // writes and reset their memory, then clear every store. Writing empty
    // expenses/preferences earlier would destroy data even if a clear fails.
    await clearStoresInSafeOrder({
      clearRestoreJournal,
      resetProviders: () => resetRegistryRef.current.runAll(),
      clearRelationalData,
      clearAuxiliaryData,
    });

    try {
      await clearRecurringSkips();
    } catch (error) {
      console.error('[cashtrack] Failed to clear recurring skips during reset', error);
    }

    // d. Persist the empty state only after all clears succeed.
    const expRes = await expenseSaveQueue.current.enqueue(() => saveExpenses([]));
    if (!expRes) throw new Error('Failed to save empty expenses during reset');
    const prefRes = await preferencesSaveQueue.current.enqueue(() => savePreferences(DEFAULT_PREFERENCES));
    if (!prefRes) throw new Error('Failed to save default preferences during reset');
    try {
      await saveAppLockFlag(false);
    } catch (error) {
      console.error('[cashtrack] Failed to clear the App Lock setting during reset', error);
    }

    // e. Reset expense/preference memory, clear loadFailed refs and dataLoadError, set lastSaved refs
    expenseLoadFailedRef.current = false;
    preferencesLoadFailedRef.current = false;
    setDataLoadError(false);
    setDataRecovered(false);
    setExpensesSaveError(false);
    setPreferencesSaveError(false);

    expensesRef.current = [];
    preferencesRef.current = DEFAULT_PREFERENCES;
    dispatch({ type: 'HYDRATE', expenses: [] });
    setPreferences(DEFAULT_PREFERENCES);
    lastSavedExpensesRef.current = JSON.stringify([]);
    lastSavedPreferencesRef.current = JSON.stringify(DEFAULT_PREFERENCES);

    // f. Delete snapshotted receipt and profile image files and cancel notifications
    for (const uri of receiptUris) {
      try {
        await deleteLocalReceipt(uri);
      } catch (error) {
        console.error('[cashtrack] Failed to delete receipt during reset', error);
      }
    }
    for (const uri of profileImageUris) {
      await deleteLocalFile(uri);
    }

    if (NotificationsModule) {
      try {
        await NotificationsModule.cancelAllScheduledNotificationsAsync();
      } catch {}
    }
  }, []);

  const themeMode = preferences.themeMode ?? 'system';

  const expenseValue = useMemo<ExpenseContextValue>(() => ({
    expenses,
    isLoading,
    dataLoadError,
    dataRecovered,
    saveError: expensesSaveError || preferencesSaveError,
    retrySave,
    registerResetHandler,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    resetAllData,
    reloadAllData,
  }), [
    expenses,
    isLoading,
    dataLoadError,
    dataRecovered,
    expensesSaveError,
    preferencesSaveError,
    retrySave,
    registerResetHandler,
    addExpense,
    updateExpense,
    deleteExpense,
    getExpense,
    resetAllData,
    reloadAllData,
  ]);

  const preferencesValue = useMemo<PreferencesContextValue>(() => ({
    preferences,
    profile: preferences.profile,
    country,
    formatAmount,
    categories,
    customCategories: preferences.customCategories,
    categoryLimits: preferences.categoryLimits,
    categoryIcons: preferences.categoryIcons,
    notifiedDebts: preferences.notifiedDebts || {},
    updateNotifiedDebts,
    updateProfile,
    setCountryCode,
    addCategory,
    renameCategory,
    deleteCategory,
    moveCategory,
    setCategoryLimit,
    setCategoryIcon,
    hasCompletedOnboarding: preferences.hasCompletedOnboarding ?? false,
    setHasCompletedOnboarding,
    themeMode,
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
    enableDailyQuotes: preferences.enableDailyQuotes ?? false,
    setEnableDailyQuotes,
    appLockEnabled: preferences.appLockEnabled ?? false,
    setAppLockEnabled,
  }), [
    preferences,
    country,
    formatAmount,
    categories,
    updateNotifiedDebts,
    updateProfile,
    setCountryCode,
    addCategory,
    renameCategory,
    deleteCategory,
    moveCategory,
    setCategoryLimit,
    setCategoryIcon,
    setHasCompletedOnboarding,
    themeMode,
    setThemeMode,
    toggleThemeMode,
    setTemperatureUnit,
    setFirstDayOfWeek,
    setEnableBillReminders,
    setEnableBudgetAlerts,
    setEnableDailyReminder,
    setEnableDailyQuotes,
    setAppLockEnabled,
  ]);

  return (
    <ExpenseContext.Provider value={expenseValue}>
      <PreferencesContext.Provider value={preferencesValue}>
        <ThemeModeContext.Provider value={themeMode}>{children}</ThemeModeContext.Provider>
      </PreferencesContext.Provider>
    </ExpenseContext.Provider>
  );
}

export function useExpenses(): ExpenseContextValue {
  const context = useContext(ExpenseContext);
  if (!context) throw new Error('useExpenses must be used inside an <ExpenseProvider>');
  return context;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside an <ExpenseProvider>');
  return context;
}
