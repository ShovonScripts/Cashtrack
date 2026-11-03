import { StyleSheet, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import type { GlyphName, IconConcept } from '@/constants/icons';
import { useTheme } from '@/hooks/use-theme';

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger';

type BadgeProps = {
  label: string;
  tone?: BadgeTone;
  icon?: IconConcept | GlyphName;
};

/** Small status pill. Status is carried by the text, with colour as a hint. */
export function Badge({ label, tone = 'neutral', icon }: BadgeProps) {
  const theme = useTheme();
  const color =
    tone === 'accent'
      ? theme.accent
      : tone === 'success'
        ? theme.success
        : tone === 'warning'
          ? theme.warning
          : tone === 'danger'
            ? theme.danger
            : theme.textSecondary;

  return (
    <View style={[styles.badge, { backgroundColor: withAlpha(color, 0.14) }]}>
      {icon ? <Icon name={icon} size="sm" color={color} /> : null}
      <ThemedText type="micro" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
});
