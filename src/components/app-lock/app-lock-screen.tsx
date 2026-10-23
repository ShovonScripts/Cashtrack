import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAppLock } from '@/context/app-lock-context';
import { useTheme } from '@/hooks/use-theme';

export function AppLockScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isAuthenticating, authError, authNeedsDeviceSetup, availability, unlock, disableForUnavailableDevice } = useAppLock();

  useEffect(() => {
    if (availability === 'checking' || availability === 'not-enrolled') return;
    const timer = setTimeout(() => {
      void unlock();
    }, 300);
    return () => clearTimeout(timer);
  }, [availability, unlock]);

  const canRecover = authNeedsDeviceSetup || availability === 'not-enrolled';

  const handleDisable = () => {
    Alert.alert(
      'Turn off App Lock?',
      'Device security is unavailable, so CashTrack cannot verify it is you. Turning App Lock off lets anyone with this device open the app.',
      [
        { text: 'Keep App Lock', style: 'cancel' },
        {
          text: 'Turn off',
          style: 'destructive',
          onPress: () => {
            void disableForUnavailableDevice();
          },
        },
      ],
    );
  };

  return (
    <View
      accessibilityViewIsModal
      style={[styles.overlay, { backgroundColor: theme.background }]}>
      <View style={[styles.glow, { backgroundColor: theme.accentMuted }]} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.five, paddingBottom: insets.bottom + Spacing.four },
        ]}>
        <View style={styles.logoWrap}>
          <Image source={require('@/assets/images/icon.png')} style={styles.logo} />
          <View style={[styles.lockBadge, { backgroundColor: theme.accentFill, borderColor: theme.background }]}>
            <MaterialCommunityIcons name="shield-lock" size={18} color={theme.onBrand} />
          </View>
        </View>

        <View style={styles.copy}>
          <ThemedText type="title" style={styles.title}>CashTrack is locked</ThemedText>
          <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
            Unlock with Face ID, fingerprint, or your device passcode.
          </ThemedText>
        </View>

        {authError ? (
          <View style={[styles.errorBanner, { backgroundColor: theme.dangerFill, borderColor: theme.dangerFill }]}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={theme.onBrand} />
            <ThemedText type="caption" style={[styles.errorText, { color: theme.onBrand }]}>
              {authError}
            </ThemedText>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Unlock CashTrack"
          disabled={isAuthenticating}
          onPress={() => void unlock()}
          style={({ pressed }) => [
            styles.unlockButton,
            { backgroundColor: theme.accentFill },
            (pressed || isAuthenticating) && styles.pressed,
          ]}>
          {isAuthenticating ? (
            <ActivityIndicator size="small" color={theme.onBrand} />
          ) : (
            <MaterialCommunityIcons name="fingerprint" size={24} color={theme.onBrand} />
          )}
          <ThemedText type="defaultBold" style={{ color: theme.onBrand }}>
            {isAuthenticating ? 'Unlocking…' : 'Unlock CashTrack'}
          </ThemedText>
        </Pressable>

        {canRecover ? (
          <View style={[styles.recovery, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.recoveryText}>
              Device security is unavailable. App Lock cannot verify you until a screen lock is set up again.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Turn off App Lock and continue"
              onPress={handleDisable}
              style={({ pressed }) => [styles.recoveryButton, pressed && styles.pressed]}>
              <ThemedText type="caption" style={{ color: theme.danger, fontWeight: '700' }}>
                Turn off App Lock
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        <ThemedText type="caption" themeColor="textSecondary" style={styles.hint}>
          Your device handles verification. CashTrack never stores a PIN.
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  logoWrap: {
    width: 104,
    height: 104,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 92,
    height: 92,
    borderRadius: Radius.xlarge,
  },
  lockBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: Spacing.two,
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 340,
  },
  errorText: {
    flexShrink: 1,
  },
  unlockButton: {
    minHeight: 54,
    minWidth: 240,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.pill,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  recovery: {
    width: '100%',
    maxWidth: 340,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.two,
    alignItems: 'center',
  },
  recoveryText: {
    textAlign: 'center',
  },
  recoveryButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
  },
  hint: {
    textAlign: 'center',
    maxWidth: 280,
  },
});
