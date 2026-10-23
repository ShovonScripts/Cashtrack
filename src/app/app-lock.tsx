import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppLock } from '@/context/app-lock-context';
import { useTheme } from '@/hooks/use-theme';
import { APP_LOCK_BACKGROUND_TIMEOUT_MS } from '@/utils/app-lock';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

const SECURITY_NOTES = [
  { icon: 'cellphone-lock', title: 'Locks on launch', copy: 'CashTrack asks for your device security every time it starts.' },
  {
    icon: 'timer-lock-outline',
    title: 'Locks in the background',
    copy: `After ${APP_LOCK_BACKGROUND_TIMEOUT_MS / 1000} seconds away, the app locks again automatically.`,
  },
  { icon: 'fingerprint', title: 'Nothing to remember', copy: 'Face ID, fingerprint, or your existing device passcode is used.' },
  { icon: 'shield-check-outline', title: 'Stored on your device', copy: 'CashTrack never creates or stores a separate PIN.' },
] as const;

export default function AppLockSettingsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { enabled, availability, authError, isAuthenticating, setEnabled, lockNow, refreshAvailability } = useAppLock();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      void refreshAvailability();
    }, [refreshAvailability]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshAvailability();
    });
    return () => subscription.remove();
  }, [refreshAvailability]);

  const handleToggle = async (next: boolean) => {
    setFeedback(null);
    setBusy(true);
    try {
      const result = await setEnabled(next);
      if (!result.ok) {
        setFeedback(result.reason);
      }
    } finally {
      setBusy(false);
    }
  };

  const availabilityMessage = (() => {
    switch (availability) {
      case 'checking':
        return 'Checking your device security…';
      case 'not-enrolled':
        return 'Set up a screen lock or biometric unlock in your device settings first.';
      case 'unsupported':
        return 'App Lock is available in the iOS and Android app only.';
      case 'error':
        return 'Could not check device security. Pull this screen closed and open it again to retry.';
      case 'available':
        return enabled
          ? 'Device security is ready and App Lock is protecting this app.'
          : 'Device security is ready. Turn on App Lock to protect CashTrack.';
    }
  })();

  const statusColor = availability === 'not-enrolled' || availability === 'unsupported' || availability === 'error'
    ? theme.warning
    : theme.textSecondary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={[styles.iconBadge, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name="shield-lock-outline" size={22} color={theme.accent} />
          </View>
          <View style={styles.headerCopy}>
            <ThemedText type="subtitle">App Lock</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Stop someone else from opening your money app.
            </ThemedText>
          </View>
        </View>

        <View style={[styles.switchRow, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <View style={styles.switchCopy}>
            <ThemedText type="smallBold">Require device authentication</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {enabled ? 'On · CashTrack is protected' : 'Off · Anyone can open CashTrack'}
            </ThemedText>
          </View>
          <Switch
            value={enabled}
            disabled={busy || isAuthenticating || availability === 'checking' || (!enabled && availability !== 'available')}
            onValueChange={(next) => {
              triggerHaptic();
              void handleToggle(next);
            }}
            accessibilityLabel="App Lock"
            trackColor={{ false: theme.border, true: theme.accent }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.statusRow}>
          {availability === 'checking' ? (
            <MaterialCommunityIcons name="progress-clock" size={16} color={theme.textSecondary} />
          ) : (
            <MaterialCommunityIcons
              name={availability === 'available' ? 'check-circle-outline' : 'alert-circle-outline'}
              size={16}
              color={statusColor}
            />
          )}
          <ThemedText type="caption" style={{ color: statusColor, flex: 1 }}>
            {availabilityMessage}
          </ThemedText>
        </View>

        {feedback ? (
          <ThemedText type="caption" themeColor="danger">
            {feedback}
          </ThemedText>
        ) : null}

        {authError && !feedback ? (
          <ThemedText type="caption" themeColor="danger">
            {authError}
          </ThemedText>
        ) : null}
      </Card>

      {enabled ? (
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <View style={[styles.iconBadge, { backgroundColor: theme.accentMuted }]}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color={theme.accent} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="smallBold">Check it works</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Lock the app now to test your device security.
              </ThemedText>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lock CashTrack now"
            accessibilityState={{ disabled: availability !== 'available' || busy || isAuthenticating }}
            disabled={availability !== 'available' || busy || isAuthenticating}
            onPress={() => {
              triggerHaptic();
              lockNow();
            }}
            style={({ pressed }) => [
              styles.lockNowButton,
              { backgroundColor: theme.accentFill },
              (pressed || availability !== 'available' || busy || isAuthenticating) && styles.pressed,
              availability !== 'available' && styles.disabled,
            ]}>
            <MaterialCommunityIcons name="lock" size={18} color={theme.onBrand} />
            <ThemedText type="defaultBold" style={{ color: theme.onBrand }}>Lock now</ThemedText>
          </Pressable>
        </Card>
      ) : null}

      <Card style={styles.card}>
        <ThemedText type="defaultBold">How it works</ThemedText>
        {SECURITY_NOTES.map((note, index) => (
          <View
            key={note.title}
            style={[
              styles.noteRow,
              index < SECURITY_NOTES.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth },
            ]}>
            <View style={[styles.noteIcon, { backgroundColor: theme.accentMuted }]}>
              <MaterialCommunityIcons name={note.icon} size={17} color={theme.accent} />
            </View>
            <View style={styles.headerCopy}>
              <ThemedText type="smallBold">{note.title}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">{note.copy}</ThemedText>
            </View>
          </View>
        ))}
      </Card>

      <ThemedText type="caption" themeColor="textSecondary" style={styles.footnote}>
        If you remove your device screen lock, you can turn App Lock off from the lock screen so you are never trapped.
      </ThemedText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  card: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  lockNowButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.four,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
  },
  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.small,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    paddingHorizontal: Spacing.two,
    textAlign: 'center',
  },
});
