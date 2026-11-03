import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { ThemedText } from '@/components/themed-text';
import {
  AmountField,
  Button,
  FormField,
  Screen,
  SegmentedControl,
  SwitchRow,
} from '@/components/ui';
import { useDebts } from '@/context/debt-context';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useIncome } from '@/context/income-context';
import { Spacing } from '@/constants/theme';
import type { DebtType } from '@/types/debt';

export default function AddDebtScreen() {
  const { addDebt, deleteDebt } = useDebts();
  const { country } = usePreferences();
  const { addExpense } = useExpenses();
  const { addIncome } = useIncome();

  const [personName, setPersonName] = useState('');
  const [amountText, setAmountText] = useState('');
  const [type, setType] = useState<DebtType>('lent');
  const [date, setDate] = useState(() => new Date());
  const [hasDueDate, setHasDueDate] = useState(false);
  const [dueDate, setDueDate] = useState(() => new Date());
  const [note, setNote] = useState('');
  const [affectBalance, setAffectBalance] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid =
    personName.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleSave = async () => {
    if (!isValid || isSaving) {
      if (!isValid) setError('Please provide a valid person name and an amount greater than zero.');
      return;
    }

    setIsSaving(true);
    setError('');
    const debt = addDebt({
      personName: personName.trim().slice(0, 50),
      amount: parsedAmount,
      type,
      date: date.toISOString(),
      dueDate: hasDueDate ? dueDate.toISOString() : null,
      note: note.trim().slice(0, 200),
    });

    try {
      if (affectBalance) {
        if (type === 'lent') {
          addExpense({
            amount: parsedAmount,
            category: 'Lending',
            date: date.toISOString(),
            note: `Lent to ${personName.trim()}${note ? ` · ${note.trim()}` : ''}`,
          });
        } else {
          await addIncome({
            amount: parsedAmount,
            date: date.toISOString(),
            note: `Borrowed from ${personName.trim()}${note ? ` · ${note.trim()}` : ''}`,
            isRecurring: false,
          });
        }
      }
      router.back();
    } catch (saveError) {
      console.error('[cashtrack] Failed to save the debt balance entry', saveError);
      deleteDebt(debt.id);
      setError('The debt was not saved because its balance entry failed. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Screen topInset={false}>
        <SegmentedControl
          label="Transaction type"
          value={type}
          onChange={setType}
          options={[
            { value: 'lent', label: 'I lent money' },
            { value: 'borrowed', label: 'I borrowed money' },
          ]}
        />

        <FormField
          label="Person name"
          value={personName}
          onChangeText={(value) => {
            setPersonName(value);
            setError('');
          }}
          placeholder="e.g. Rahim"
          autoCapitalize="words"
          maxLength={50}
        />

        <AmountField
          label="Amount"
          value={amountText}
          onChangeText={(value) => {
            setAmountText(value);
            setError('');
          }}
          symbol={country.symbol.trim()}
        />

        <View style={styles.field}>
          <ThemedText type="smallBold">Transaction date</ThemedText>
          <DatePicker value={date} onChange={setDate} label="Transaction date" />
        </View>

        <Card padded={false}>
          <SwitchRow
            label="Affect main balance"
            description={type === 'lent' ? 'Automatically log as an expense' : 'Automatically log as income'}
            value={affectBalance}
            onValueChange={setAffectBalance}
          />
          <CardDivider />
          <SwitchRow label="Set a due date" value={hasDueDate} onValueChange={setHasDueDate} />
        </Card>

        {hasDueDate ? (
          <View style={styles.field}>
            <ThemedText type="smallBold">Due date</ThemedText>
            <DatePicker value={dueDate} onChange={setDueDate} label="Due date" />
          </View>
        ) : null}

        <FormField
          label="Note"
          value={note}
          onChangeText={setNote}
          placeholder="What was this for?"
          helper="Optional"
          maxLength={200}
          multiline
        />

        {error ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {error}
          </ThemedText>
        ) : null}

        <Button label="Save debt" onPress={handleSave} disabled={!isValid} loading={isSaving} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
});
