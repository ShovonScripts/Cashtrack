import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';

import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { ReminderCategory, ReminderRepeatType } from '@/types/reminder';

const CATEGORIES: ReminderCategory[] = [
  'Bills',
  'EMI',
  'Loan',
  'Rent',
  'Credit Card',
  'Insurance',
  'Subscription',
  'Education',
  'Tax',
  'Utilities',
  'Other',
];

const REPEAT_TYPES: { label: string; value: ReminderRepeatType }[] = [
  { label: 'One-time', value: 'one-time' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

export default function AddBillScreen() {
  const theme = useTheme();
  const { addReminder } = useFinancialReminders();

  const [title, setTitle] = useState('');
  const [isVariableAmount, setIsVariableAmount] = useState(false);
  const [amountText, setAmountText] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('Bills');
  const [dueDate, setDueDate] = useState(() => new Date());
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>('monthly');
  const [notes, setNotes] = useState('');

  // EMI specific fields
  const [totalAmountText, setTotalAmountText] = useState('');
  const [totalInstallmentsText, setTotalInstallmentsText] = useState('');

  const [error, setError] = useState('');

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid =
    title.trim().length > 0 &&
    (isVariableAmount || (!Number.isNaN(parsedAmount) && Number.isFinite(parsedAmount) && parsedAmount > 0));

  const handleSave = async () => {
    if (!isValid) {
      setError('Please provide a valid bill name and amount.');
      return;
    }

    const isEmi = category === 'EMI';
    const totalAmount = isEmi && totalAmountText.trim() ? Number(totalAmountText) : null;
    const totalInstallments = isEmi && totalInstallmentsText.trim() ? Number(totalInstallmentsText) : null;

    await addReminder({
      title: title.trim().slice(0, 60),
      amount: isVariableAmount ? null : parsedAmount,
      isVariableAmount,
      category,
      dueDate: dueDate.toISOString(),
      repeatType,
      notes: notes.trim().slice(0, 200),
      totalAmount: Number.isFinite(totalAmount) ? totalAmount : null,
      installmentAmount: isVariableAmount ? null : parsedAmount,
      totalInstallments: Number.isInteger(totalInstallments) ? totalInstallments : null,
      paidInstallments: 0,
    });

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
          {/* Bill Title */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">BILL / REMINDER NAME</ThemedText>
            <TextInput
              value={title}
              onChangeText={(v) => { setTitle(v); setError(''); }}
              placeholder="e.g. Internet Bill or Home EMI"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="sentences"
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {/* Amount & Variable Toggle */}
          <View style={styles.field}>
            <View style={styles.dueDateHeader}>
              <ThemedText type="caption" themeColor="textSecondary">AMOUNT</ThemedText>
              <View style={styles.variableRow}>
                <ThemedText type="caption" themeColor="textSecondary">Amount varies</ThemedText>
                <Switch
                  value={isVariableAmount}
                  onValueChange={(val) => { setIsVariableAmount(val); setError(''); }}
                  trackColor={{ false: theme.cardMuted, true: theme.accent }}
                />
              </View>
            </View>
            {!isVariableAmount && (
              <TextInput
                value={amountText}
                onChangeText={(v) => { setAmountText(v.replace(/[^0-9.]/g, '')); setError(''); }}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                style={[styles.input, styles.amountInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
            )}
          </View>

          {/* Category */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">CATEGORY</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? theme.accent : theme.cardMuted,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.textSecondary }}>
                      {cat}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* EMI Specific Fields */}
          {category === 'EMI' && (
            <View style={[styles.emiCard, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <ThemedText type="defaultBold">EMI Loan Details (Optional)</ThemedText>
              <View style={styles.rowFields}>
                <View style={[styles.field, styles.flex1]}>
                  <ThemedText type="caption" themeColor="textSecondary">TOTAL LOAN</ThemedText>
                  <TextInput
                    value={totalAmountText}
                    onChangeText={(v) => setTotalAmountText(v.replace(/[^0-9.]/g, ''))}
                    placeholder="120000"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="decimal-pad"
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                  />
                </View>
                <View style={[styles.field, styles.flex1]}>
                  <ThemedText type="caption" themeColor="textSecondary">INSTALLMENTS</ThemedText>
                  <TextInput
                    value={totalInstallmentsText}
                    onChangeText={(v) => setTotalInstallmentsText(v.replace(/[^0-9]/g, ''))}
                    placeholder="12"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.background }]}
                  />
                </View>
              </View>
            </View>
          )}

          {/* Due Date */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">DUE DATE</ThemedText>
            <DatePicker value={dueDate} onChange={setDueDate} />
          </View>

          {/* Repeat / Recurrence */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">REPEAT FREQUENCY</ThemedText>
            <View style={styles.typeRow}>
              {REPEAT_TYPES.map((rep) => {
                const selected = repeatType === rep.value;
                return (
                  <Pressable
                    key={rep.value}
                    onPress={() => setRepeatType(rep.value)}
                    style={[
                      styles.typeButton,
                      {
                        backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <ThemedText type="caption" style={{ fontWeight: '700', color: selected ? theme.accent : theme.textSecondary }} numberOfLines={1}>
                      {rep.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <ThemedText type="caption" themeColor="textSecondary">NOTES (OPTIONAL)</ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Account number, website, or reference"
              placeholderTextColor={theme.textSecondary}
              multiline
              style={[styles.input, styles.noteInput, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
            />
          </View>

          {error ? <ThemedText type="caption" themeColor="danger">{error}</ThemedText> : null}

          <Pressable
            onPress={handleSave}
            disabled={!isValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !isValid }}
            style={({ pressed }) => [
              styles.saveButton,
              { backgroundColor: theme.accent },
              pressed && styles.pressed,
              !isValid && styles.saveButtonDisabled,
            ]}>
            <ThemedText type="defaultBold" style={styles.saveText}>Save Reminder</ThemedText>
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
  field: { gap: Spacing.one },
  variableRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, fontSize: 16 },
  amountInput: { fontSize: 22, fontWeight: '700', fontVariant: ['tabular-nums'] },
  chipScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  chip: { height: 38, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  emiCard: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.large, borderWidth: StyleSheet.hairlineWidth },
  rowFields: { flexDirection: 'row', gap: Spacing.two },
  flex1: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: Spacing.two },
  typeButton: { flex: 1, height: 42, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.one },
  dueDateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  saveButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.three, borderRadius: Radius.medium, marginTop: Spacing.two },
  saveButtonDisabled: { opacity: 0.4 },
  saveText: { color: '#FFFFFF' },
  cancelButton: { alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two },
  pressed: { opacity: 0.7 },
});
