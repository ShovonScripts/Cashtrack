import { useLocalSearchParams, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { DatePicker } from '@/components/date-picker';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, FormField, Screen, SegmentedControl, SkeletonList, SwitchRow } from '@/components/ui';
import { useDebts } from '@/context/debt-context';
import { usePreferences } from '@/context/expense-context';
import { Spacing } from '@/constants/theme';
import type { DebtRecord, DebtType } from '@/types/debt';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getDebt, isLoading } = useDebts();

  const debt = getDebt(id);

  if (!debt && isLoading) {
    return (
      <Screen topInset={false}>
        <SkeletonList rows={3} label="Loading debt" />
      </Screen>
    );
  }

  if (!debt) {
    return (
      <Screen topInset={false}>
        <EmptyState
          title="Not found"
          message="This debt record no longer exists."
          icon="account-cash-outline"
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return <EditDebtForm key={debt.id} debt={debt} />;
}

function EditDebtForm({ debt }: { debt: DebtRecord }) {
  const { updateDebt } = useDebts();
  const { country } = usePreferences();

  const [personName, setPersonName] = useState(() => debt.personName);
  const [amountText, setAmountText] = useState(() => String(debt.amount));
  const [type, setType] = useState<DebtType>(() => debt.type);
  const [date, setDate] = useState(() => new Date(debt.date));
  const [hasDueDate, setHasDueDate] = useState(() => Boolean(debt.dueDate));
  const [dueDate, setDueDate] = useState(() => (debt.dueDate ? new Date(debt.dueDate) : new Date()));
  const [note, setNote] = useState(() => debt.note ?? '');
  const [error, setError] = useState('');

  const parsedAmount = amountText.trim() === '' ? NaN : Number(amountText);
  const isValid =
    personName.trim().length > 0 &&
    !Number.isNaN(parsedAmount) &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0;

  const handleSave = () => {
    if (!isValid) {
      setError('Please provide a valid person name and an amount greater than zero.');
      return;
    }

    updateDebt(debt.id, {
      personName: personName.trim().slice(0, 50),
      amount: parsedAmount,
      type,
      date: date.toISOString(),
      dueDate: hasDueDate ? dueDate.toISOString() : null,
      note: note.trim().slice(0, 200),
    });

    router.back();
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

        <Button label="Save changes" onPress={handleSave} disabled={!isValid} />
        <Button label="Cancel" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
});
