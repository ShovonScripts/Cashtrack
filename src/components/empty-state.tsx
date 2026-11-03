import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  title: string;
  message: string;
  /** Tints the badge, e.g. with a category accent. Defaults to the theme accent. */
  tone?: string;
  /** Icon shown in the badge. */
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  /** Label and handler for the main next step, such as "Add expense". */
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, message, tone, icon, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();
  const color = tone ?? theme.accent;

  return (
    <View style={styles.container}>
      <ThemedView type="backgroundElement" style={[styles.badge, { backgroundColor: withAlpha(color, 0.14) }]}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={30} color={color} />
        ) : (
          <View style={[styles.badgeInner, { borderColor: color }]} />
        )}
      </ThemedView>

      <ThemedText type="defaultBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>

      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} style={styles.action} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
  },
  badge: {
    width: Spacing.six,
    height: Spacing.six,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  badgeInner: {
    width: Spacing.three,
    height: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  action: {
    minWidth: 180,
    marginTop: Spacing.two,
  },
});
