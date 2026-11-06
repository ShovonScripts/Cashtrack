import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, FormField, Screen, StatStrip, SwitchRow } from '@/components/ui';
import { usePreferences } from '@/context/expense-context';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getReminderRemainingAmount, isOverpayment } from '@/utils/reminder-payment';

export default function PayBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getReminder, markAsPaid, isLoading } = useFinancialReminders();

  const reminder = getReminder(id);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
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

  return <PayBillForm key={reminder.id} reminder={reminder} onPay={markAsPaid} />;
}

type PayBillFormProps = {
  reminder: ReminderWithDerivedStatus;
  onPay: (id: string, amount: number, date: string, recordAsExpense: boolean, note?: string) => Promise<void>;
};

function PayBillForm({ reminder, onPay }: PayBillFormProps) {
  const { country, formatAmount } = usePreferences();
  const remainingAmount = getReminderRemainingAmount(reminder);
  const paidThisCycle = Math.max(0, reminder.paidAmountCurrentCycle ?? 0);
  const isFullyCovered = remainingAmount !== null && remainingAmount <= 0;
  const [amountText, setAmountText] = useState(() =>
    remainingAmount !== null && remainingAmount > 0 ? String(remainingAmount) : '',
  );
  const [paidDate, setPaidDate] = useState(() => new Date());
  const [recordAsExpense, setRecordAsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [amountError, setAmountError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePay = async () => {
    if (isSubmitting) return;
    if (reminder.status === 'paid') {
      setSubmitError('This bill is already marked as paid.');
      return;
    }
    const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Enter an amount above zero.');
      return;
    }
    if (isOverpayment(reminder, parsedAmount)) {
      setAmountError(`This is more than the ${formatAmount(remainingAmount ?? 0)} left to pay.`);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onPay(reminder.id, parsedAmount, paidDate.toISOString(), recordAsExpense, note);
      router.back();
    } catch (err) {
      console.error('[cashtrack] Failed to mark bill as paid', err);
      setSubmitError(err instanceof Error && err.message ? err.message : 'Could not save this payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  let amountHelper: string | undefined;
  if (reminder.isVariableAmount) amountHelper = 'This bill varies. Enter the exact amount you paid.';
  else if (remainingAmount !== null && paidThisCycle > 0 && remainingAmount > 0) {
    amountHelper = 'The amount left is filled in. You can pay part of it.';
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <View style={styles.intro}>
          <ThemedText type="subtitle">{reminder.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {reminder.category}
          </ThemedText>
        </View>

        {remainingAmount !== null && paidThisCycle > 0 ? (
          <StatStrip
            items={[
              { label: 'Bill', value: formatAmount(reminder.amount ?? 0) },
              { label: 'Paid', value: formatAmount(paidThisCycle), tone: 'success' },
              { label: 'Left', value: formatAmount(Math.max(0, remainingAmount)) },
            ]}
          />
        ) : null}

        {isFullyCovered ? (
          <Card variant="muted">
            <ThemedText type="small" themeColor="textSecondary">
              This bill is fully paid for the current cycle. Nothing more to record.
            </ThemedText>
          </Card>
        ) : (
          <>
            <AmountField
              label="Amount paid"
              value={amountText}
              onChangeText={(value) => {
                setAmountText(value);
                setAmountError('');
                setSubmitError('');
              }}
              symbol={country.symbol.trim()}
              helper={amountHelper}
              error={amountError}
            />

            <View style={styles.field}>
              <ThemedText type="smallBold">Payment date</ThemedText>
              <DatePicker value={paidDate} onChange={setPaidDate} label="Payment date" />
            </View>

            <Card padded={false}>
              <SwitchRow
                label="Record as an expense"
                description="Adds this payment to your expenses and budgets."
                value={recordAsExpense}
                onValueChange={setRecordAsExpense}
              />
            </Card>

            <FormField
              label="Note"
              value={note}
              onChangeText={setNote}
              placeholder="Transaction ref or receipt note"
              helper="Optional"
              maxLength={200}
            />
          </>
        )}

        {submitError ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {submitError}
          </ThemedText>
        ) : null}

        {isFullyCovered ? (
          <Button label="Done" onPress={() => router.back()} />
        ) : (
          <>
            <Button label="Confirm payment" onPress={handlePay} loading={isSubmitting} />
            <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
          </>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, padding: Spacing.four },
  centerText: { textAlign: 'center' },
  intro: { gap: Spacing.half },
  field: { gap: Spacing.one },
});
