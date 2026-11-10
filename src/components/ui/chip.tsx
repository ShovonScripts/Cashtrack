import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ChipProps = {
  label: string;
  /** Omit for an action chip (such as a quick amount) that is never a selected choice. */
  selected?: boolean;
  onPress: () => void;
  /** Spoken label when the visible text is shorter, such as "+500". */
  accessibilityLabel?: string;
};

/** A single-choice filter chip with a 44dp touch target. */
export function Chip({ label, selected = false, onPress, accessibilityLabel }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? theme.accentFill : theme.cardMuted,
          borderColor: selected ? theme.accentFill : theme.border,
        },
        pressed && styles.pressed,
      ]}>
      <ThemedText
        type="caption"
        style={{ color: selected ? theme.onBrand : theme.textSecondary, fontWeight: selected ? '700' : '600' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.75 },
});
