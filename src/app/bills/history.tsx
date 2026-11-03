import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { Screen, SkeletonList, StatStrip } from '@/components/ui';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import { usePreferences } from '@/context/expense-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';

export default function BillPaymentHistoryScreen() {
  const theme = useTheme();
  const { payments, reminders, isLoading, remindersLoadError, reloadReminders } = useFinancialReminders();
  const { formatAmount } = usePreferences();

  const reminderTitles = new Map(reminders.map((reminder) => [reminder.id, reminder.title]));
  const sortedPayments = [...payments].sort((first, second) => second.paidDate.localeCompare(first.paidDate));
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (isLoading && payments.length === 0) {
    return (
      <Screen topInset={false}>
        <SkeletonList rows={4} label="Loading payments" />
      </Screen>
    );
  }

  return (
    <Screen topInset={false}>
        <StatStrip
          items={[
            { label: 'Total paid', value: formatAmount(totalPaid) },
            { label: 'Payments', value: String(payments.length) },
          ]}
        />

        {remindersLoadError ? (
          <Card style={styles.emptyCard}>
            <LoadErrorState
              title="Couldn't load payment history"
              message="Your bill payments are safe, but they couldn't be read just now."
              onRetry={reloadReminders}
              isRetrying={isLoading}
            />
          </Card>
        ) : sortedPayments.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              title="No bill payments yet"
              message="Payments you record against bills and subscriptions will appear here."
              tone={theme.accent}
              icon="history"
            />
          </Card>
        ) : (
          <View style={styles.list}>
            {sortedPayments.map((payment) => {
              const title = reminderTitles.get(payment.reminderId) ?? 'Deleted bill';
              const canOpenExpense = Boolean(payment.expenseId);
              const content = (
                <>
                  <View style={[styles.paymentIcon, { backgroundColor: theme.cardMuted }]}>
                    <MaterialCommunityIcons name="receipt-text-outline" size={18} color={theme.accent} />
                  </View>
                  <View style={styles.paymentCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>{title}</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {formatDate(payment.paidDate)}
                      {payment.expenseId ? ' · Added to expenses' : ''}
                    </ThemedText>
                    {payment.notes ? (
                      <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                        {payment.notes}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.paymentRight}>
                    <ThemedText type="smallBold">{formatAmount(payment.amount)}</ThemedText>
                    {canOpenExpense && (
                      <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                    )}
                  </View>
                </>
              );

              if (!payment.expenseId) {
                return (
                  <Card key={payment.id} style={styles.paymentRow}>
                    {content}
                  </Card>
                );
              }

              return (
                <Pressable
                  key={payment.id}
                  onPress={() => router.push({ pathname: '/expense/[id]', params: { id: payment.expenseId! } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Open expense for ${title}`}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <Card style={styles.paymentRow}>{content}</Card>
                </Pressable>
              );
            })}
          </View>
        )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  paymentIcon: { width: 36, height: 36, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1, gap: 1 },
  paymentRight: { alignItems: 'flex-end', gap: 2 },
  pressed: { opacity: 0.75 },
});
