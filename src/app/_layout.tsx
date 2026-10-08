import { DarkTheme, DefaultTheme, Stack, ThemeProvider, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { LoadingScreen } from '@/components/loading-screen';
import { ThemedText } from '@/components/themed-text';
import { ExpenseProvider, useExpenses } from '@/context/expense-context';
import { DebtProvider, useDebts } from '@/context/debt-context';
import { IncomeProvider } from '@/context/income-context';
import { GoalProvider } from '@/context/goal-context';
import { FinancialRemindersProvider } from '@/context/financial-reminders-context';
import { useTheme } from '@/hooks/use-theme';
import { runSqliteCrudTest } from '@/storage/sqlite-crud-test';
import { confirmDelete, notify } from '@/utils/confirm';

SplashScreen.preventAutoHideAsync();

/** Holds the navigator back until the saved expenses have been read. */
function Navigation() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isLoading, dataLoadError, resetAllData } = useExpenses();
  const { debtLoadError } = useDebts();

  if (isLoading) {
    return <LoadingScreen />;
  }

  const showLoadErrorBanner = dataLoadError || debtLoadError;

  const handleStartFresh = async () => {
    try {
      await resetAllData();
    } catch {
      notify('Reset Failed', 'Could not reset all data. Please try again.');
    }
  };

  const renderAddButton = () => (
    <Pressable
      onPress={() => router.push('/add-expense')}
      accessibilityRole="button"
      accessibilityLabel="Add an expense"
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.accent },
        pressed && styles.addButtonPressed,
      ]}>
      <View style={styles.addIcon}>
        <ThemedText type="defaultBold" style={styles.addIconText}>＋</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
    </Pressable>
  );

  const renderAddDebtButton = () => (
    <Pressable
      onPress={() => router.push('/debts/add')}
      accessibilityRole="button"
      accessibilityLabel="Add a debt record"
      hitSlop={8}
      style={({ pressed }) => [
        styles.addButton,
        { backgroundColor: theme.accent },
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
        { backgroundColor: theme.accent },
        pressed && styles.addButtonPressed,
      ]}>
      <View style={styles.addIcon}>
        <ThemedText type="defaultBold" style={styles.addIconText}>＋</ThemedText>
      </View>
      <ThemedText type="smallBold" style={styles.addButtonText}>Add</ThemedText>
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      {showLoadErrorBanner && (
        <View style={{ backgroundColor: '#EF4444', paddingTop: insets.top + 8, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 999 }}>
          <ThemedText style={{ color: '#FFFFFF', flex: 1, fontSize: 13, fontWeight: '600' }}>
            Saved data could not be read. New changes will NOT be saved.
          </ThemedText>
          <Pressable
            onPress={() => confirmDelete('Start Fresh', 'This will reset your data and clear the error. Proceed?', () => void handleStartFresh())}
            style={{ backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 }}>
            <ThemedText style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Start fresh</ThemedText>
          </Pressable>
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
        <Stack.Screen name="expenses" options={{ title: 'Expenses', headerRight: renderAddButton }} />
        <Stack.Screen name="debts" options={{ title: 'Lend & Borrow', headerRight: renderAddDebtButton }} />
        <Stack.Screen name="debts/add" options={{ title: 'Add Debt', presentation: 'modal' }} />
        <Stack.Screen name="debts/[id]" options={{ title: 'Debt Details' }} />
        <Stack.Screen name="debts/[id]/edit" options={{ title: 'Edit Debt' }} />
        <Stack.Screen name="bills" options={{ title: 'Bills & Reminders', headerRight: renderAddBillButton }} />
        <Stack.Screen name="bills/add" options={{ title: 'Add Bill / Reminder', presentation: 'modal' }} />
        <Stack.Screen name="bills/pay/[id]" options={{ title: 'Mark as Paid', presentation: 'modal' }} />
        <Stack.Screen name="profile" options={{ title: 'Profile & settings' }} />
        <Stack.Screen name="country" options={{ title: 'Country & currency' }} />
        <Stack.Screen name="categories" options={{ title: 'Manage categories' }} />
        <Stack.Screen name="budgets" options={{ title: 'Category limits' }} />
        <Stack.Screen name="advisor" options={{ title: 'Spending advisor' }} />
        <Stack.Screen name="reports" options={{ title: 'Monthly reports' }} />
        <Stack.Screen name="about" options={{ title: 'About CashTrack' }} />
        <Stack.Screen name="add-expense" options={{ title: 'Add Expense', presentation: 'modal' }} />
        <Stack.Screen name="expense/[id]" options={{ title: 'Expense' }} />
        <Stack.Screen name="expense/[id]/edit" options={{ title: 'Edit Expense' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  addButton: {
    minHeight: 40,
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
});

function useSqliteCrudTest() {
  useEffect(() => {
    if (!__DEV__) {
      return;
    }
    void runSqliteCrudTest();
  }, []);
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

export default function RootLayout() {
  useSqliteCrudTest();

  return (
    <ExpenseProvider>
      <AppThemeProvider>
        <DebtProvider>
          <IncomeProvider>
            <GoalProvider>
              <FinancialRemindersProvider>
                <AnimatedSplashOverlay />
                <Navigation />
              </FinancialRemindersProvider>
            </GoalProvider>
          </IncomeProvider>
        </DebtProvider>
      </AppThemeProvider>
    </ExpenseProvider>
  );
}
