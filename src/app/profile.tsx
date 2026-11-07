import { usePreventRemove } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { OnboardingModal } from '@/components/onboarding-modal';
import { AlertsTab } from '@/components/profile/alerts-tab';
import { DataTab } from '@/components/profile/data-tab';
import { IdentityTab } from '@/components/profile/identity-tab';
import { ProfileHeader } from '@/components/profile/profile-header';
import { SettingsTab } from '@/components/profile/settings-tab';
import { useProfileDraft } from '@/components/profile/use-profile-draft';
import { ThemedText } from '@/components/themed-text';
import { Button, Screen, SegmentedControl } from '@/components/ui';
import { Elevation, MaxContentWidth, Spacing } from '@/constants/theme';
import { useToast } from '@/context/toast-context';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/motion';

type TabKey = 'profile' | 'settings' | 'alerts' | 'data';

const TABS: { value: TabKey; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'settings', label: 'Settings' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'data', label: 'Data' },
];

export default function ProfileScreen() {
  const theme = useTheme();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const draft = useProfileDraft();
  const [tab, setTab] = useState<TabKey>('profile');
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);

  // Leaving with unsaved profile edits: ask first, and tidy up if they discard.
  const pendingLeave = useRef<(() => void) | null>(null);
  const [leaving, setLeaving] = useState(false);
  usePreventRemove(draft.isDirty && !leaving, ({ repeat }) => {
    confirmAction(
      'Discard your changes?',
      'Your profile edits have not been saved.',
      () => {
        draft.discard();
        pendingLeave.current = repeat;
        setLeaving(true);
      },
      'Discard',
    );
  });
  useEffect(() => {
    if (leaving && pendingLeave.current) {
      const go = pendingLeave.current;
      pendingLeave.current = null;
      go();
    }
  }, [leaving]);

  const save = async () => {
    triggerHaptic();
    if (await draft.save()) toast.show({ message: 'Profile saved' });
  };

  return (
    <View style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <Screen topInset={false} contentStyle={draft.isDirty ? styles.roomForSaveBar : undefined}>
          <ProfileHeader draft={draft} />

          <SegmentedControl
            label="Profile and settings sections"
            value={tab}
            onChange={(value) => {
              triggerHaptic();
              setTab(value);
            }}
            options={TABS}
          />

          {tab === 'profile' ? <IdentityTab draft={draft} /> : null}
          {tab === 'settings' ? <SettingsTab /> : null}
          {tab === 'alerts' ? <AlertsTab /> : null}
          {tab === 'data' ? <DataTab onErased={draft.clearAfterReset} onReplayWalkthrough={() => setWalkthroughOpen(true)} /> : null}
        </Screen>
      </KeyboardAvoidingView>

      {draft.isDirty ? (
        <View
          style={[
            styles.saveBar,
            !isDark && Elevation.top,
            { backgroundColor: theme.card, borderColor: theme.cardBorder, paddingBottom: Math.max(insets.bottom, Spacing.three) },
          ]}>
          <View style={styles.saveBarInner}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Unsaved changes</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {draft.ageError ? 'Fix the age to save' : 'Your profile edits'}
              </ThemedText>
            </View>
            <Button label="Discard" variant="ghost" onPress={draft.discard} style={styles.barButton} />
            <Button
              label="Save"
              onPress={() => void save()}
              loading={draft.saving}
              disabled={Boolean(draft.ageError)}
              style={styles.barButton}
            />
          </View>
        </View>
      ) : null}

      <OnboardingModal visible={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  // Keeps the last field clear of the save bar.
  roomForSaveBar: { paddingBottom: Spacing.six + Spacing.five },
  saveBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  saveBarInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barButton: { minWidth: 96 },
});
