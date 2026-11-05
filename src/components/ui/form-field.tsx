import type { ComponentRef, ReactNode, Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type FormFieldProps = Pick<
  TextInputProps,
  | 'value'
  | 'onChangeText'
  | 'placeholder'
  | 'keyboardType'
  | 'autoCapitalize'
  | 'maxLength'
  | 'multiline'
  | 'returnKeyType'
  | 'onSubmitEditing'
  | 'editable'
  // Autofill: lets the keyboard offer the user's saved name, email and phone.
  | 'autoComplete'
  | 'textContentType'
  | 'autoCorrect'
> & {
  label: string;
  /** Hint under the field. Replaced by the error when there is one. */
  helper?: string;
  error?: string;
  /** Content before the text, such as a currency symbol. */
  prefix?: ReactNode;
  inputRef?: Ref<ComponentRef<typeof TextInput>>;
};

/**
 * The one text field: label above, field, then helper or error text. Errors use
 * an icon and words as well as colour, and are announced to screen readers.
 */
export function FormField({
  label,
  helper,
  error,
  prefix,
  inputRef,
  multiline,
  returnKeyType,
  ...inputProps
}: FormFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.wrapper}>
      <ThemedText type="smallBold">{label}</ThemedText>
      <View
        style={[
          styles.field,
          multiline && styles.multiline,
          { backgroundColor: theme.cardMuted, borderColor: error ? theme.danger : theme.border },
        ]}>
        {prefix}
        <TextInput
          ref={inputRef}
          {...inputProps}
          multiline={multiline}
          returnKeyType={returnKeyType ?? (multiline ? 'default' : 'done')}
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel={label}
          accessibilityHint={error ?? helper}
          style={[styles.input, multiline && styles.inputMultiline, { color: theme.text }]}
        />
      </View>
      {error ? (
        <View style={styles.message} accessibilityLiveRegion="polite">
          <Icon name="error" size="sm" color={theme.danger} />
          <ThemedText type="caption" style={{ color: theme.danger }}>
            {error}
          </ThemedText>
        </View>
      ) : helper ? (
        <ThemedText type="caption" themeColor="textSecondary">
          {helper}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.one },
  field: {
    minHeight: MinTouchTarget + Spacing.one,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: Spacing.two },
  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: Typography.body.fontSize,
  },
  inputMultiline: { minHeight: 88, textAlignVertical: 'top' },
  message: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
});
