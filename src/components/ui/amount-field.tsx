import type { ComponentRef, Ref } from 'react';
import type { TextInput } from 'react-native';

import { FormField } from '@/components/ui/form-field';
import { ThemedText } from '@/components/themed-text';
import { sanitizeAmountInput } from '@/utils/amount-input';

type AmountFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  /** Currency symbol shown before the number. */
  symbol: string;
  helper?: string;
  error?: string;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
};

/** Money input: decimal keypad, symbol prefix, and only valid amount characters. */
export function AmountField({ label, value, onChangeText, symbol, helper, error, inputRef }: AmountFieldProps) {
  return (
    <FormField
      label={label}
      value={value}
      onChangeText={(text) => onChangeText(sanitizeAmountInput(text))}
      keyboardType="decimal-pad"
      placeholder="0.00"
      helper={helper}
      error={error}
      inputRef={inputRef}
      prefix={
        <ThemedText type="defaultBold" themeColor="textSecondary">
          {symbol}
        </ThemedText>
      }
    />
  );
}
