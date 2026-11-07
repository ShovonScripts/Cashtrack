import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

type SearchFieldProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  /** Spoken name, such as "Search notes". */
  label: string;
};

/** The one search box: magnifier, text, and a clear button once there is text. */
export function SearchField({ value, onChangeText, placeholder, label }: SearchFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.field, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
      <Icon name="search" size="md" color={theme.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        accessibilityLabel={label}
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            triggerHaptic();
            onChangeText('');
          }}
          accessibilityRole="button"
          accessibilityLabel="Clear search text"
          style={({ pressed }) => [styles.clear, pressed && styles.pressed]}>
          <Icon name="close-circle" size="sm" color={theme.textSecondary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingStart: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: Spacing.two,
    fontSize: Typography.small.fontSize,
  },
  clear: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
});
