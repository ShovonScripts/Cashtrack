import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Icon } from '@/components/ui/icon';
import type { GlyphName, IconConcept } from '@/constants/icons';
import { BadgeSize, MinTouchTarget, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon: IconConcept | GlyphName;
  /** Accent colour for the icon badge. */
  color: string;
  /** Short live status shown beside the title, such as "3 overdue". Never a fixed label. */
  badge?: string;
  badgeTone?: BadgeTone;
  onPress: () => void;
  accessibilityHint?: string;
  /** Shows a spinner instead of the chevron and ignores taps, e.g. while exporting. */
  busy?: boolean;
  disabled?: boolean;
  /** Icon at the end instead of the chevron: 'share' for actions that hand a file to another app. */
  trailing?: IconConcept | GlyphName;
};

/** A tappable row with an icon badge, title, optional subtitle and chevron. */
export function ListRow({
  title,
  subtitle,
  icon,
  color,
  badge,
  badgeTone = 'neutral',
  onPress,
  accessibilityHint,
  busy = false,
  disabled = false,
  trailing = 'next',
}: ListRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityState={{ busy, disabled: busy || disabled }}
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
      accessibilityHint={accessibilityHint ?? subtitle}
      style={({ pressed }) => [styles.row, disabled && styles.disabled, pressed && PressFeedback]}>
      <View style={[styles.iconBadge, { backgroundColor: withAlpha(color, 0.12) }]}>
        <Icon name={icon} size="md" color={color} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          {badge ? (
            // Wrapped so the pill centres on the title line (Badge pins itself to the start).
            <View>
              <Badge label={badge} tone={badgeTone} />
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      {busy ? <ActivityIndicator color={color} /> : <Icon name={trailing} size="md" color={theme.textSecondary} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  iconBadge: {
    width: BadgeSize.md,
    height: BadgeSize.md,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: Spacing.half },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  title: { flexShrink: 1 },
  disabled: { opacity: 0.5 },
});
