import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { MinTouchTarget, Radius, withAlpha } from '@/constants/theme';
import type { GlyphName, IconConcept } from '@/constants/icons';
import { useTheme } from '@/hooks/use-theme';

type IconButtonProps = {
  icon: IconConcept | GlyphName;
  /** Required: an icon-only control has no visible text, so it needs a spoken name. */
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'tinted';
  /** Use for destructive actions such as delete. */
  tone?: 'default' | 'danger';
  disabled?: boolean;
};

/** Icon-only button with a 44 dp touch target. */
export function IconButton({ icon, label, onPress, variant = 'plain', tone = 'default', disabled = false }: IconButtonProps) {
  const theme = useTheme();
  const color = tone === 'danger' ? theme.danger : theme.accent;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.button,
        variant === 'tinted' && { backgroundColor: withAlpha(color, 0.12) },
        disabled && styles.disabled,
        pressed && styles.pressed,
      ]}>
      <Icon name={icon} size="lg" color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minWidth: MinTouchTarget,
    minHeight: MinTouchTarget,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.6 },
});
