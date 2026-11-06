import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, Chip, FormField, Screen, SegmentedControl, SwitchRow } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import type { FinancialReminder, FinancialReminderDraft, ReminderCategory, ReminderRepeatType } from '@/types/reminder';
import { BILL_CATEGORIES, BILL_REPEAT_TYPES, validateBillForm, type BillFormErrors } from '@/utils/bill-form';

type BillReminderFormProps = {
  initial?: FinancialReminder;
  paidThisCycle?: number;
  submitLabel: string;
  onSubmit: (draft: FinancialReminderDraft) => Promise<void>;
};

const numberText = (value: number | null | undefined) => (value !== null && value !== undefined ? String(value) : '');

/** The Add and Edit bill / reminder form. */
export function BillReminderForm({ initial, paidThisCycle = 0, submitLabel, onSubmit }: BillReminderFormProps) {
  const { country, formatAmount } = usePreferences();
  const symbol = country.symbol.trim();

  const [title, setTitle] = useState(() => initial?.title ?? '');
  const [isVariableAmount, setIsVariableAmount] = useState(() => initial?.isVariableAmount ?? false);
  const [amountText, setAmountText] = useState(() => numberText(initial?.amount));
  const [category, setCategory] = useState<ReminderCategory>(() => initial?.category ?? 'Bills');
  const [dueDate, setDueDate] = useState(() => (initial ? new Date(initial.dueDate) : new Date()));
  const [repeatType, setRepeatType] = useState<ReminderRepeatType>(() => initial?.repeatType ?? 'monthly');
  const [notes, setNotes] = useState(() => initial?.notes ?? '');
  const [isAlarm, setIsAlarm] = useState(() => initial?.isAlarm ?? false);
  const [alarmTime, setAlarmTime] = useState(() => initial?.alarmTime ?? '09:00');
  const [totalAmountText, setTotalAmountText] = useState(() => numberText(initial?.totalAmount));
  const [totalInstallmentsText, setTotalInstallmentsText] = useState(() => numberText(initial?.totalInstallments));

  const [errors, setErrors] = useState<BillFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearError = (field: keyof BillFormErrors) => {
    setSubmitError('');
    if (errors[field]) setErrors(({ [field]: _removed, ...rest }) => rest);
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    const { errors: found, parsed } = validateBillForm(
      {
        title,
        isVariableAmount,
        amount: amountText,
        category,
        isAlarm,
        alarmTime,
        totalAmount: totalAmountText,
        totalInstallments: totalInstallmentsText,
      },
      paidThisCycle,
    );
    setErrors(found);
    if (!parsed) return;

    setIsSubmitting(true);
    setSubmitError('');
    try {
      await onSubmit({
        title: parsed.title,
        amount: parsed.amount,
        isVariableAmount,
        category,
        dueDate: dueDate.toISOString(),
        repeatType,
        notes: notes.trim().slice(0, 200),
        totalAmount: parsed.totalAmount,
        installmentAmount: parsed.amount,
        totalInstallments: parsed.totalInstallments,
        isAlarm,
        alarmTime: parsed.alarmTime,
      });
      router.back();
    } catch (err) {
      console.error('[cashtrack] Failed to save bill reminder', err);
      setSubmitError(err instanceof Error && err.message ? err.message : 'Could not save this bill. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const paidInstallments = initial?.paidInstallments ?? 0;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <FormField
          label="Bill or reminder name"
          value={title}
          onChangeText={(value) => {
            setTitle(value);
            clearError('title');
          }}
          placeholder="e.g. Internet bill or Home EMI"
          autoCapitalize="sentences"
          maxLength={60}
          error={errors.title}
        />

        <Card padded={false}>
          <SwitchRow
            label="Amount varies"
            description="Turn on for bills that change each time, like electricity."
            value={isVariableAmount}
            onValueChange={(value) => {
              setIsVariableAmount(value);
              clearError('amount');
            }}
          />
        </Card>

        {!isVariableAmount ? (
          <AmountField
            label="Amount"
            value={amountText}
            onChangeText={(value) => {
              setAmountText(value);
              clearError('amount');
            }}
            symbol={symbol}
            helper={paidThisCycle > 0 ? `Already paid this cycle: ${formatAmount(paidThisCycle)}` : undefined}
            error={errors.amount}
          />
        ) : null}

        <View style={styles.field}>
          <ThemedText type="smallBold">Category</ThemedText>
          <View style={styles.chips}>
            {BILL_CATEGORIES.map((cat) => (
              <Chip key={cat} label={cat} selected={category === cat} onPress={() => setCategory(cat)} />
            ))}
          </View>
        </View>

        {category === 'EMI' ? (
          <Card variant="muted" style={styles.group}>
            <View style={styles.groupHeader}>
              <ThemedText type="smallBold">Loan details</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Optional. Used to track how many installments are left.
              </ThemedText>
            </View>
            <AmountField
              label="Total loan"
              value={totalAmountText}
              onChangeText={(value) => {
                setTotalAmountText(value);
                clearError('totalAmount');
              }}
              symbol={symbol}
              error={errors.totalAmount}
            />
            <FormField
              label="Number of installments"
              value={totalInstallmentsText}
              onChangeText={(value) => {
                setTotalInstallmentsText(value.replace(/[^0-9]/g, ''));
                clearError('totalInstallments');
              }}
              placeholder="12"
              keyboardType="number-pad"
              maxLength={4}
              error={errors.totalInstallments}
              helper={
                paidInstallments > 0
                  ? `Paid so far: ${paidInstallments}${initial?.totalInstallments ? ` of ${initial.totalInstallments}` : ''}`
                  : undefined
              }
            />
          </Card>
        ) : null}

        <View style={styles.field}>
          <ThemedText type="smallBold">Due date</ThemedText>
          <DatePicker value={dueDate} onChange={setDueDate} label="Due date" />
        </View>

        <View style={styles.field}>
          <ThemedText type="smallBold">Repeat</ThemedText>
          <SegmentedControl label="Repeat" value={repeatType} onChange={setRepeatType} options={BILL_REPEAT_TYPES} />
        </View>

        <Card padded={false}>
          <SwitchRow
            label="Alarm on the due date"
            description="Rings a high-priority alert instead of a quiet notification."
            value={isAlarm}
            onValueChange={(value) => {
              setIsAlarm(value);
              clearError('alarmTime');
            }}
          />
          {isAlarm ? (
            <>
              <CardDivider />
              <View style={styles.inset}>
                <FormField
                  label="Alarm time"
                  value={alarmTime}
                  onChangeText={(value) => {
                    setAlarmTime(value);
                    clearError('alarmTime');
                  }}
                  placeholder="09:00"
                  keyboardType="numbers-and-punctuation"
                  maxLength={5}
                  helper="24-hour time, for example 09:00."
                  error={errors.alarmTime}
                />
              </View>
            </>
          ) : null}
        </Card>

        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Account number, website or reference"
          helper="Optional"
          maxLength={200}
          multiline
        />

        {submitError ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {submitError}
          </ThemedText>
        ) : null}

        <Button label={submitLabel} onPress={handleSave} loading={isSubmitting} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  group: { gap: Spacing.three },
  groupHeader: { gap: Spacing.half },
  inset: { padding: Spacing.three },
});
