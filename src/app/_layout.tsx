import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppLockGate } from '@/components/app-lock/app-lock-gate';
import { LoadingScreen } from '@/components/loading-screen';
import { AppLockProvider } from '@/context/app-lock-context';
import { ThemedText } from '@/components/themed-text';
import { ExpenseProvider, useExpenses } from '@/context/expense-context';
import { DebtProvider, useDebts } from '@/context/debt-context';
import { IncomeProvider } from '@/context/income-context';
import { GoalProvider } from '@/context/goal-context';
import { FinancialRemindersProvider } from '@/context/financial-reminders-context';
import { useTheme } from '@/hooks/use-theme';
import { runSqliteCrudTest } from '@/storage/sqlite-crud-test';
import { confirmDelete, notify } from '@/utils/confirm';
import { cancelQuoteNotificationsAsync, scheduleDailyQuoteNotificationsAsync } from '@/utils/quote-notifications';
import {
  cancelSpendingReminderNotificationsAsync,
  scheduleDailySpendingReminderNotificationsAsync,
} from '@/utils/spending-reminder-notifications';
import { FloatingToolsButton } from '@/components/floating-tools/FloatingToolsButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StopwatchProvider } from '@/context/stopwatch-context';

SplashScreen.preventAutoHideAsync();

/** Holds the navigator back until the saved expenses have been read. */
function Navigation() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isLoading, dataLoadError, dataRecovered, resetAllData, enableDailyReminder, enableDailyQuotes } = useExpenses();
  const { debtLoadError, debtRecovered } = useDebts();

  const reminderQueueRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    if (!enableDailyQuotes) {
      void cancelQuoteNotificationsAsync();
      return;
    }
    void scheduleDailyQuoteNotificationsAsync().catch((error) => {
      console.error('[cashtrack] Failed to schedule daily quote notifications', error);
    });
  }, [enableDailyQuotes]);

  useEffect(() => {
    reminderQueueRef.current = reminderQueueRef.current
      .catch(() => {})
      .then(async () => {
        if (enableDailyReminder) {
          await scheduleDailySpendingReminderNotificationsAsync();
        } else {
          await cancelSpendingReminderNotificationsAsync();
        }
      })
      .catch((error) => {
        console.error('[cashtrack] Failed to update daily reminder notifications', error);
      });
  }, [enableDailyReminder]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  const unrecoveredLoadError = dataLoadError || debtLoadError;
  const recoveredData = !unrecoveredLoadError && (dataRecovered || debtRecovered);
  const showLoadErrorBanner = unrecoveredLoadError || recoveredData;

  const handleStartFresh = async () => {
    try {
      await resetAllData();
    } catch {
      notify('Reset Failed', 'Could not reset all data. Please try again.');
    }
  };



  const renderAddDebtButton = () => (
    <Pressable
      onPress={() => router.push('/debts/add')}
      accessibilityRole="button"
      accessibilityLabel="Add a debt record"
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.accentFill },
        pressed && styles.addButtonPressed,
      ]}>
      <View style={styles.addIcon}>
        <ThemedText type="defaultBold" style={styles.addIconText}>＋</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
    </Pressable>
  );

  const renderAddBillButton = () => (
    <Pressable
      onPress={() => router.push('/bills/add')}
      accessibilityRole="button"
      accessibilityLabel="Add a bill or reminder"
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.accentFill },
        pressed && styles.addButtonPressed,
      ]}>
      <View style={styles.addIcon}>
        <ThemedText type="defaultBold" style={styles.addIconText}>＋</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
    </Pressable>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={{ flex: 1, backgroundColor: theme.background }}>
      {showLoadErrorBanner && (
        <View style={{ backgroundColor: recoveredData ? theme.accentFill : theme.dangerFill, paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 999 }}>
          <ThemedText style={{ color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '600' }}>
            {recoveredData
              ? 'Some saved data was unreadable. The original was backed up and new changes will save.'
              : 'Saved data could not be read. New changes will NOT be saved.'}
          </ThemedText>
          {!recoveredData && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Start fresh and reset data"
              onPress={() => confirmDelete('Start Fresh', 'This will reset your data and clear the error. Proceed?', () => void handleStartFresh())}
              style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, minHeight: 44, justifyContent: 'center' }}>
              <ThemedText style={{ color: theme.danger, fontSize: 12, fontWeight: '700' }}>Start fresh</ThemedText>
            </Pressable>
          )}
        </View>
      )}
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontSize: 18, fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="income" options={{ title: 'Money In' }} />
        <Stack.Screen name="goals" options={{ title: 'Money Plan & Pots' }} />
        <Stack.Screen name="goals/add" options={{ title: 'Create Pot / Goal', presentation: 'modal' }} />
        <Stack.Screen name="goals/[id]" options={{ title: 'Goal Details' }} />
        <Stack.Screen name="debts" options={{ title: 'Lend & Borrow', headerRight: renderAddDebtButton }} />
        <Stack.Screen name="debts/add" options={{ title: 'Add Debt', presentation: 'modal' }} />
        <Stack.Screen name="debts/[id]" options={{ title: 'Debt Details' }} />
        <Stack.Screen name="debts/[id]/edit" options={{ title: 'Edit Debt' }} />
        <Stack.Screen name="bills" options={{ title: 'Bills & Reminders', headerRight: renderAddBillButton }} />
        <Stack.Screen name="bills/add" options={{ title: 'Add Bill / Reminder', presentation: 'modal' }} />
        <Stack.Screen name="bills/pay/[id]" options={{ title: 'Mark as Paid', presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile & settings' }} />
        <Stack.Screen name="app-lock" options={{ title: 'App Lock' }} />
        <Stack.Screen name="country" options={{ title: 'Country & currency' }} />
        <Stack.Screen name="categories" options={{ title: 'Manage categories' }} />
        <Stack.Screen name="budgets" options={{ title: 'Category limits' }} />
        <Stack.Screen name="advisor" options={{ title: 'Spending advisor' }} />
        <Stack.Screen name="weather" options={{ title: 'Weather & Insights' }} />
        <Stack.Screen name="world-clock" options={{ headerShown: false }} />
        <Stack.Screen name="calculator" options={{ headerShown: false }} />
        <Stack.Screen name="stopwatch" options={{ headerShown: false }} />
        <Stack.Screen name="currency" options={{ headerShown: false }} />
        <Stack.Screen name="notes" options={{ headerShown: false }} />
        <Stack.Screen name="notes-add" options={{ title: 'New Note', presentation: 'modal' }} />
        <Stack.Screen name="notes-edit" options={{ title: 'Edit Note', presentation: 'modal' }} />
        <Stack.Screen name="about" options={{ title: 'About CashTrack' }} />
        <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
        <Stack.Screen name="period-report" options={{ title: 'Spending Report' }} />
        <Stack.Screen name="expense/[id]" options={{ title: 'Expense' }} />
        <Stack.Screen name="expense/[id]/edit" options={{ title: 'Edit Expense' }} />
      </Stack>
      <FloatingToolsButton />
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingLeft: 8,
    paddingRight: 14,
    borderRadius: 999,
  },
  addIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  addIconText: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 22,
  },
  addButtonText: {
    color: '#FFFFFF',
    lineHeight: 20,
  },
  addButtonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.97 }],
  },
  errorScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 12,
    padding: 24,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBadgeText: {
    fontSize: 26,
    fontWeight: '800',
  },
  errorTitle: {
    fontSize: 19,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  errorDetails: {
    width: '100%',
    fontSize: 11,
    lineHeight: 16,
    padding: 10,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorButton: {
    minHeight: 46,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    marginTop: 4,
  },
  errorButtonPressed: {
    opacity: 0.8,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

function useSqliteCrudTest() {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    void runSqliteCrudTest();
  }, []);
}

function AppLockHost({ children }: { children: ReactNode }) {
  const { isLoading } = useExpenses();

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <AppLockProvider>
      <AppLockGate>{children}</AppLockGate>
    </AppLockProvider>
  );
}

function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDark = theme.text === '#ffffff';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      {children}
    </ThemeProvider>
  );
}

/** Catches render errors so a broken screen never leaves the app on a blank page. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <RootErrorScreen error={error} retry={retry} />;
}

function RootErrorScreen({ error, retry }: ErrorBoundaryProps) {
  const isDark = useColorScheme() === 'dark';
  const palette = isDark
    ? { background: '#0C0F12', card: '#151A1F', border: '#283038', text: '#F4F7FA', muted: '#9BA6B2', accent: '#159A8C' }
    : { background: '#F5F6F3', card: '#FFFFFF', border: '#E2E5E0', text: '#11181C', muted: '#5F6B75', accent: '#0E7C70' };

  useEffect(() => {
    console.error('[cashtrack] Unhandled render error', error);
  }, [error]);

  return (
    <View style={[styles.errorScreen, { backgroundColor: palette.background }]}>
      <View style={[styles.errorCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={[styles.errorBadge, { backgroundColor: `${palette.accent}1E` }]}>
          <Text style={[styles.errorBadgeText, { color: palette.accent }]}>!</Text>
        </View>
        <Text style={[styles.errorTitle, { color: palette.text }]}>Something went wrong</Text>
        <Text style={[styles.errorBody, { color: palette.muted }]}>
          This screen hit an unexpected error. Your saved data is safe. Try again, and if it keeps happening, restart the app.
        </Text>
        {__DEV__ && (
          <Text style={[styles.errorDetails, { color: palette.muted, borderColor: palette.border }]}>
            {error.message}
          </Text>
        )}
        <Pressable
          onPress={() => void retry()}
          accessibilityRole="button"
          accessibilityLabel="Try again"
          style={({ pressed }) => [
            styles.errorButton,
            { backgroundColor: palette.accent },
            pressed && styles.errorButtonPressed,
          ]}>
          <Text style={styles.errorButtonText}>Try Again</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function RootLayout() {
  useSqliteCrudTest();

  return (
    <ExpenseProvider>
      <AppThemeProvider>
        <DebtProvider>
          <IncomeProvider>
            <GoalProvider>
              <FinancialRemindersProvider>
                <StopwatchProvider>
                  <AnimatedSplashOverlay />
                  <AppLockHost>
                    <Navigation />
                  </AppLockHost>
                </StopwatchProvider>
              </FinancialRemindersProvider>
            </GoalProvider>
          </IncomeProvider>
        </DebtProvider>
      </AppThemeProvider>
    </ExpenseProvider>
  );
}
