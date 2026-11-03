import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Palette, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SwitchRowProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

/**
 * A setting that is on or off. The whole row is the control, so the tap target
 * is large and a screen reader sees one switch, not a row plus a switch.
 */
export function SwitchRow({ label, description, value, onValueChange, disabled = false }: SwitchRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value, disabled }}
      style={({ pressed }) => [styles.row, disabled && styles.disabled, pressed && styles.pressed]}>
      <View style={styles.copy}>
        <ThemedText type="smallBold">{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {description}
          </ThemedText>
        ) : null}
      </View>
      <View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        <Switch
          value={value}
          accessibilityLabel={label}
          trackColor={{ false: theme.border, true: theme.accent }}
          thumbColor={Palette.white}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  copy: { flex: 1, gap: Spacing.half },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.7 },
});
