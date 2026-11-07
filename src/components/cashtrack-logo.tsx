import { StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * Compact CashTrack wordmark for the navigation header.
 */
export function SpendlyLogo() {
  const theme = useTheme();

  return (
    <View style={styles.container} accessible accessibilityLabel="CashTrack, track with clarity">
      <View style={styles.wordmarkCopy}>
        <ThemedText type="defaultBold" style={styles.wordmark}>
          <Text style={{ color: theme.accent }}>C</Text>
          <Text>ashTrack</Text>
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.tagline}>
          TRACK WITH CLARITY
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  wordmarkCopy: { gap: 0 },
  wordmark: { fontSize: 19, lineHeight: 22, letterSpacing: -0.6, fontWeight: '800' },
  tagline: { fontSize: 8, lineHeight: 11, letterSpacing: 1.05, fontWeight: '700' },
});
