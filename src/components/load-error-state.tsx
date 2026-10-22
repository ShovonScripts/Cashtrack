import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type LoadErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
  isRetrying?: boolean;
};

export function LoadErrorState({ title, message, onRetry, isRetrying = false }: LoadErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityLiveRegion="polite">
      <View style={[styles.badge, { backgroundColor: theme.accentMuted }]}>
        <MaterialCommunityIcons name="database-alert-outline" size={26} color={theme.danger} />
      </View>
      <ThemedText type="defaultBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {message}
      </ThemedText>
      <Pressable
        onPress={onRetry}
        disabled={isRetrying}
        accessibilityRole="button"
        accessibilityLabel="Try loading again"
        accessibilityState={{ disabled: isRetrying }}
        style={({ pressed }) => [
          styles.retryButton,
          { backgroundColor: theme.accentMuted },
          pressed && styles.pressed,
          isRetrying && styles.disabled,
        ]}>
        <ThemedText type="smallBold" style={{ color: theme.accent }}>
          {isRetrying ? 'Retrying…' : 'Try again'}
        </ThemedText>
      </Pressable>
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
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.6,
  },
});
