import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Opaque cover painted as soon as the app leaves the foreground. It hides
 * balances and transactions from the OS app-switcher snapshot without asking
 * for authentication during the grace period.
 */
export function PrivacyCover() {
  const theme = useTheme();

  return (
    <View
      accessibilityViewIsModal
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={[styles.glow, { backgroundColor: theme.accentMuted }]} />
      <View style={[styles.badge, { backgroundColor: theme.accentFill }]}>
        <MaterialCommunityIcons name="shield-lock" size={34} color={theme.onBrand} />
      </View>
      <ThemedText type="title">CashTrack</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        Hidden for privacy
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 360,
    height: 360,
    borderRadius: 180,
    top: -140,
    alignSelf: 'center',
  },
  badge: {
    width: 72,
    height: 72,
    borderRadius: Radius.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
});
