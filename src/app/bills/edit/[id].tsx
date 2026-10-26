import { useLocalSearchParams, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { BillReminderForm } from '@/components/bill-reminder-form';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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
        <ThemedText type="small" themeColor="textSecondary">Loading bill…</ThemedText>
      </View>
    );
  }

  if (!reminder) {
    return (
      <View style={styles.centered}>
        <ThemedText type="subtitle">Bill not found</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.notFoundText}>
          This bill or reminder no longer exists.
        </ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <BillReminderForm
      key={reminder.id}
      initial={reminder}
      paidThisCycle={Math.max(0, reminder.paidAmountCurrentCycle ?? 0)}
      submitLabel="Save Changes"
      onSubmit={async (draft) => {
        await updateReminder(reminder.id, draft);
      }}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: { textAlign: 'center' },
  backButton: { marginTop: Spacing.two },
});
