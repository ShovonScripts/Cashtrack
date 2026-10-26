import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { useExpenses } from '@/context/expense-context';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getReminderRemainingAmount, isOverpayment } from '@/utils/reminder-payment';

export default function PayBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getReminder, markAsPaid, isLoading } = useFinancialReminders();

  const reminder = getReminder(id);

  if (isLoading) {
    return (
      <View style={[styles.contentContainer, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!reminder) {
    return (
      <View style={[styles.contentContainer, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ThemedText type="subtitle">Reminder not found</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back</ThemedText>
        </Pressable>
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
  const theme = useTheme();
  const { formatAmount } = useExpenses();
  const remainingAmount = getReminderRemainingAmount(reminder);
  const paidThisCycle = Math.max(0, reminder.paidAmountCurrentCycle ?? 0);
  const isFullyCovered = remainingAmount !== null && remainingAmount <= 0;
  const [amountText, setAmountText] = useState(() =>
    remainingAmount !== null && remainingAmount > 0 ? String(remainingAmount) : '',
  );
  const [paidDate, setPaidDate] = useState(() => new Date());
  const [recordAsExpense, setRecordAsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid =
    !isFullyCovered &&
    !Number.isNaN(parsedAmount) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handlePay = async () => {
    if (isSubmitting) return;
    if (reminder.status === 'paid') {
      setError('This bill is already marked as paid.');
      return;
    }
    if (isFullyCovered) {
      setError('This bill is already fully paid for the current cycle.');
      return;
    }
    if (!isValid) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }
    if (isOverpayment(reminder, parsedAmount)) {
      setError(`Payment cannot exceed the remaining balance of ${formatAmount(remainingAmount ?? 0)}.`);
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onPay(reminder.id, parsedAmount, paidDate.toISOString(), recordAsExpense, note);
      router.back();
    } catch (err) {
      console.error('[cashtrack] Failed to mark bill as paid', err);
      setError(err instanceof Error && err.message ? err.message : 'Could not save this payment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.container}>
          <View style={styles.headerBox}>
            <ThemedText type="caption" themeColor="textSecondary">RECORD BILL PAYMENT</ThemedText>
            <ThemedText type="subtitle">{reminder.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Category: {reminder.category}</ThemedText>
          </View>

          {remainingAmount !== null && paidThisCycle > 0 && (
            <View style={[styles.summaryBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
              <View style={styles.summaryRow}>
                <ThemedText type="caption" themeColor="textSecondary">BILL AMOUNT</ThemedText>
                <ThemedText type="smallBold">{formatAmount(reminder.amount ?? 0)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText type="caption" themeColor="textSecondary">ALREADY PAID</ThemedText>
                <ThemedText type="smallBold" style={{ color: theme.success }}>{formatAmount(paidThisCycle)}</ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <ThemedText type="caption" themeColor="textSecondary">REMAINING</ThemedText>
                <ThemedText type="defaultBold" style={{ color: theme.accent }}>{formatAmount(remainingAmount)}</ThemedText>
              </View>
            </View>
          )}

          {/* Amount */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">PAYMENT AMOUNT</ThemedText>
            <TextInput
              value={amountText}
              onChangeText={(v) => { setAmountText(v.replace(/[^0-9.]/g, '')); setError(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              accessibilityLabel="Payment amount"
              style={[styles.input, styles.amountInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
            {reminder.isVariableAmount ? (
              <ThemedText type="caption" themeColor="textSecondary">This is a variable bill. Enter the exact amount paid.</ThemedText>
            ) : remainingAmount !== null && paidThisCycle > 0 && remainingAmount > 0 ? (
              <ThemedText type="caption" themeColor="textSecondary">The remaining balance is prefilled. You can pay only part of it.</ThemedText>
            ) : isFullyCovered ? (
              <ThemedText type="caption" themeColor="danger">This bill is already fully paid for the current cycle.</ThemedText>
            ) : null}
          </View>

          {/* Record as Expense Toggle */}
          <View style={styles.field}>
            <View style={styles.dueDateHeader}>
              <View style={styles.toggleLabelCopy}>
                <ThemedText type="smallBold">Record as an expense</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  Automatically add this payment to your expense ledger and budgets
                </ThemedText>
              </View>
              <Switch
                value={recordAsExpense}
                onValueChange={setRecordAsExpense}
                accessibilityLabel="Record as an expense"
                trackColor={{ false: theme.cardMuted, true: theme.accent }}
              />
            </View>
          </View>

          {/* Paid Date */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">PAYMENT DATE</ThemedText>
            <DatePicker value={paidDate} onChange={setPaidDate} label="Payment date" />
          </View>

          {/* Note */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">NOTE (OPTIONAL)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Transaction ref, receipt note..."
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Payment note"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {error ? <ThemedText type="caption" themeColor="danger">{error}</ThemedText> : null}

          <Pressable
            onPress={handlePay}
            disabled={!isValid || isSubmitting}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid || isSubmitting, busy: isSubmitting }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.accentFill },
              pressed && styles.pressed,
              (!isValid || isSubmitting) && styles.saveButtonDisabled,
            ]}>
            <ThemedText type="defaultBold" style={{ color: theme.onBrand }}>
              {isFullyCovered ? 'Fully Paid' : isSubmitting ? 'Saving…' : 'Confirm Payment ✓'}
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
            <ThemedText type="defaultBold" themeColor="textSecondary">Cancel</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  contentContainer: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  headerBox: { gap: 4, paddingBottom: Spacing.one },
  summaryBox: { gap: Spacing.one, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, padding: Spacing.three },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  field: { gap: Spacing.one },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  amountInput: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dueDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabelCopy: { flex: 1, gap: 2, paddingRight: Spacing.two },
  saveButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Radius.medium, marginTop: Spacing.two },
  saveButtonDisabled: { opacity: 0.4 },
  cancelButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
