import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MinTouchTarget, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type ListRowProps = {
  title: string;
  subtitle?: string;
  icon: IconName;
  /** Accent colour for the icon badge. */
  color: string;
  /** Short status text shown beside the title, such as "3 overdue". */
  badge?: string;
  badgeColor?: string;
  onPress: () => void;
  accessibilityHint?: string;
};

/** A tappable row with an icon badge, title, optional subtitle and chevron. */
export function ListRow({
  title,
  subtitle,
  icon,
  color,
  badge,
  badgeColor,
  onPress,
  accessibilityHint,
}: ListRowProps) {
  const theme = useTheme();
  const tint = badgeColor ?? color;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${title}, ${badge}` : title}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconBadge, { backgroundColor: withAlpha(color, 0.12) }]}>
        <MaterialCommunityIcons name={icon} size={20} color={color} />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleLine}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.title}>
            {title}
          </ThemedText>
          {badge ? (
            <View
              style={[
                styles.badge,
                { backgroundColor: withAlpha(tint, 0.12), borderColor: withAlpha(tint, 0.25) },
              ]}>
              <ThemedText type="caption" style={[styles.badgeText, { color: tint }]}>
                {badge}
              </ThemedText>
            </View>
          ) : null}
        </View>
        {subtitle ? (
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget + Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  pressed: { opacity: 0.75 },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 1 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flexShrink: 1 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: { fontWeight: '800' },
});
