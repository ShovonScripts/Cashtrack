import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PayBillScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { getReminder, markAsPaid } = useFinancialReminders();

  const reminder = getReminder(id);

  const [amountText, setAmountText] = useState(() => (reminder?.amount !== null && reminder?.amount !== undefined ? String(reminder.amount) : ''));
  const [paidDate, setPaidDate] = useState(() => new Date());
  const [recordAsExpense, setRecordAsExpense] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (!reminder) {
    return (
      <View style={[styles.contentContainer, { justifyContent: 'center', alignItems: 'center', padding: Spacing.four }]}>
        <ThemedText type="subtitle">Reminder not found</ThemedText>
        <Pressable onPress={() => router.back()} style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back</ThemedText>
        </Pressable>
      </View>
    );
  }

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid = !Number.isNaN(parsedAmount) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handlePay = async () => {
    if (!isValid) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    await markAsPaid(reminder.id, parsedAmount, paidDate.toISOString(), recordAsExpense, note);
    router.back();
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
            <ThemedText type="caption" themeColor="textSecondary">MARK AS PAID</ThemedText>
            <ThemedText type="subtitle">{reminder.title}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">Category: {reminder.category}</ThemedText>
          </View>

          {/* Amount */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">PAYMENT AMOUNT</ThemedText>
            <TextInput
              value={amountText}
              onChangeText={(v) => { setAmountText(v.replace(/[^0-9.]/g, '')); setError(''); }}
              placeholder="0.00"
              placeholderTextColor={theme.textSecondary}
              keyboardType="decimal-pad"
              style={[styles.input, styles.amountInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
            {reminder.isVariableAmount && (
              <ThemedText type="caption" themeColor="textSecondary">This is a variable bill. Enter the exact amount paid.</ThemedText>
            )}
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
                trackColor={{ false: theme.cardMuted, true: theme.accent }}
              />
            </View>
          </View>

          {/* Paid Date */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">PAYMENT DATE</ThemedText>
            <DatePicker value={paidDate} onChange={setPaidDate} />
          </View>

          {/* Note */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">NOTE (OPTIONAL)</ThemedText>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Transaction ref, receipt note..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {error ? <ThemedText type="caption" themeColor="danger">{error}</ThemedText> : null}

          <Pressable
            onPress={handlePay}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
              !isValid && styles.saveButtonDisabled,
            ]}>
            <ThemedText type="defaultBold" style={styles.saveText}>Confirm Payment ✓</ThemedText>
          </Pressable>

          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}>
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
  field: { gap: Spacing.one },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  amountInput: { fontSize: 24, fontWeight: '700', fontVariant: ['tabular-nums'] },
  dueDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  toggleLabelCopy: { flex: 1, gap: 2, paddingRight: Spacing.two },
  saveButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Radius.medium, marginTop: Spacing.two },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF' },
  cancelButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
