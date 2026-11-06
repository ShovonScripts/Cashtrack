import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { BillReminderForm } from '@/components/bill-reminder-form';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function EditBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getReminder, updateReminder, isLoading } = useFinancialReminders();
  const theme = useTheme();
  const reminder = getReminder(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
        <ThemedText type="small" themeColor="textSecondary">
          Loading bill…
        </ThemedText>
      </View>
    );
  }

  if (!reminder) {
    return (
      <View style={styles.centered}>
        <ThemedText type="subtitle">Bill not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.centerText}>
          This bill or reminder no longer exists.
        </ThemedText>
        <Button label="Go back" variant="ghost" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <BillReminderForm
      key={reminder.id}
      initial={reminder}
      paidThisCycle={Math.max(0, reminder.paidAmountCurrentCycle ?? 0)}
      submitLabel="Save changes"
      onSubmit={async (draft) => {
        await updateReminder(reminder.id, draft);
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  centerText: { textAlign: 'center' },
});
