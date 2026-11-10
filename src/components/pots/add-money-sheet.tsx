import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AmountField, Button, Chip, FormField, Sheet } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { roundMoney } from '@/utils/money';
import { triggerHaptic } from '@/utils/motion';

const QUICK_AMOUNTS = [100, 500, 1000, 5000] as const;

type AddMoneySheetProps = {
  visible: boolean;
  onClose: () => void;
  potTitle: string;
  /** What is still needed to reach the target; offered as a one-tap amount. */
  remainingAmount: number;
  /** Throw to keep the sheet open; the sheet shows that saving failed. */
  onSave: (amount: number, note: string) => Promise<void>;
};

/** Short task, so a sheet instead of a form card halfway down the page. */
export function AddMoneySheet({ visible, onClose, potTitle, remainingAmount, onSave }: AddMoneySheetProps) {
  const { country, formatAmount } = usePreferences();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const close = () => {
    setAmount('');
    setNote('');
    setError('');
    onClose();
  };

  const addToAmount = (value: number) => {
    triggerHaptic();
    setError('');
    setAmount((current) => {
      const base = Number(current);
      return String(roundMoney((Number.isFinite(base) ? base : 0) + value));
    });
  };

  const save = async () => {
    if (isSaving) return;
    const parsed = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      setError('Enter an amount above zero.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      await onSave(parsed, note);
      close();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} title={`Add money to ${potTitle}`}>
      <AmountField
        label="Amount"
        value={amount}
        onChangeText={(value) => {
          setAmount(value);
          setError('');
        }}
        symbol={country.symbol.trim()}
        error={error}
      />
      <View style={styles.chips} accessibilityLabel="Quick amounts">
        {QUICK_AMOUNTS.map((value) => (
          <Chip
            key={value}
            label={`+${value}`}
            accessibilityLabel={`Add ${formatAmount(value)} to the amount`}
            onPress={() => addToAmount(value)}
          />
        ))}
        {remainingAmount > 0 ? (
          <Chip
            label="Rest of target"
            accessibilityLabel={`Use the rest of the target, ${formatAmount(remainingAmount)}`}
            onPress={() => {
              triggerHaptic();
              setError('');
              setAmount(String(roundMoney(remainingAmount)));
            }}
          />
        ) : null}
      </View>
      <ThemedText type="caption" themeColor="textSecondary">
        Each quick amount adds to what you have typed.
      </ThemedText>
      <FormField
        label="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Monthly savings transfer"
        maxLength={80}
      />
      <Button label="Add money" onPress={save} loading={isSaving} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
