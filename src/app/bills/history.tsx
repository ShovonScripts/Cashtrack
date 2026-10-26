import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';

export default function BillPaymentHistoryScreen() {
  const theme = useTheme();
  const { payments, reminders, isLoading, remindersLoadError, reloadReminders } = useFinancialReminders();
  const { formatAmount } = useExpenses();

  const reminderTitles = new Map(reminders.map((reminder) => [reminder.id, reminder.title]));
  const sortedPayments = [...payments].sort((first, second) => second.paidDate.localeCompare(first.paidDate));
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);

  if (isLoading && payments.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.accent} size="large" />
        <ThemedText type="small" themeColor="textSecondary">Loading payments…</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        <View style={[styles.summaryCard, { backgroundColor: theme.accentMuted, borderColor: theme.border }]}>
          <View style={[styles.summaryIcon, { backgroundColor: theme.accentFill }]}>
            <MaterialCommunityIcons name="history" size={22} color={theme.onBrand} />
          </View>
          <View style={styles.summaryCopy}>
            <ThemedText type="caption" themeColor="textSecondary">TOTAL PAID</ThemedText>
            <ThemedText type="subtitle" numberOfLines={1} adjustsFontSizeToFit>
              {formatAmount(totalPaid)}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded
            </ThemedText>
          </View>
        </View>

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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  summaryIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCopy: { flex: 1, gap: 1 },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  list: { gap: Spacing.two },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  paymentIcon: { width: 36, height: 36, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1, gap: 1 },
  paymentRight: { alignItems: 'flex-end', gap: 2 },
  pressed: { opacity: 0.75 },
});
