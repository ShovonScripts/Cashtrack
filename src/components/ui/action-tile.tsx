import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui/icon';
import type { GlyphName } from '@/constants/icons';
import { Elevation, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';

type ActionTileProps = {
  /** One word where possible, so every tile in a row keeps a single line. */
  label: string;
  icon: GlyphName;
  /**
   * The feature's own hue, as a 6-digit hex token. Defaults to the brand
   * accent. Pick hues that keep 3:1 against the tinted badge in both themes.
   */
  color?: string;
  /** What the tap does ("Add a bill reminder"), not just the name. */
  accessibilityLabel: string;
  onPress: () => void;
};

/**
 * The standard square shortcut: a raised surface, a tinted badge in the
 * feature's hue, and a one-line label. Every tile is drawn the same way so a
 * grid of them reads as one control, and only the hue and glyph change.
 */
export function ActionTile({ label, icon, color, accessibilityLabel, onPress }: ActionTileProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const hue = color ?? theme.accent;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.card, borderColor: theme.cardBorder },
        // Same depth rule as Card: a soft shadow on the light page, a hairline
        // edge on black where shadows cannot be seen.
        !isDark && Elevation.low,
        pressed && PressFeedback,
      ]}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: withAlpha(hue, isDark ? 0.18 : 0.12),
            borderColor: withAlpha(hue, isDark ? 0.34 : 0.22),
          },
        ]}>
        <Icon name={icon} size="lg" color={hue} />
      </View>
      <ThemedText type="caption" style={styles.label} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    minHeight: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.one,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
