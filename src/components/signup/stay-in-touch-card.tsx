import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { StayInTouchForm } from '@/components/signup/stay-in-touch-form';
import { ThemedText } from '@/components/themed-text';
import { Button, Sheet } from '@/components/ui';
import { FeatureColors, Spacing, withAlpha } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { useSignup } from '@/context/signup-context';
import { useToast } from '@/context/toast-context';
import { confirmAction } from '@/utils/confirm';
import { hasErrors, validateSignup, type SignupErrors, type SignupInput } from '@/utils/signup';

/**
 * Profile & settings entry for the optional sign-up: join (for people who
 * skipped it in onboarding), see what was shared, or withdraw and delete.
 */
export function StayInTouchCard() {
  const { preferences, profile } = usePreferences();
  const { record, loaded, join, withdraw } = useSignup();
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<SignupInput>({ name: '', email: '', phone: '', consent: false });
  const [errors, setErrors] = useState<SignupErrors>({});

  if (!loaded) return null;

  const joined = record?.status === 'pending' || record?.status === 'sent';
  const deleting = record?.status === 'withdraw-pending';

  const openSheet = () => {
    setForm({ name: profile.name, email: '', phone: '', consent: false });
    setErrors({});
    setSheetOpen(true);
  };

  const submit = () => {
    const next = validateSignup(form);
    setErrors(next);
    if (hasErrors(next)) return;
    void join(form, preferences.countryCode);
    setSheetOpen(false);
    toast.show({ message: 'Thanks for joining. You are on the list.' });
  };

  const confirmWithdraw = () =>
    confirmAction(
      'Withdraw and delete?',
      'Your name, email and phone are removed from this phone now, and a request is sent to delete our copy. Your money records are not affected.',
      async () => {
        await withdraw();
        toast.show({ message: 'Your details were removed.' });
      },
      'Withdraw',
    );

  let status: string;
  if (joined && record) {
    status =
      record.status === 'sent'
        ? `Joined as ${record.email}. Updates ${record.consent ? 'on' : 'off'}.`
        : `Saved as ${record.email}. It sends the next time you are online.`;
  } else if (deleting) {
    status = 'Deletion requested. It sends the next time you are online.';
  } else {
    status = 'Optional. Hear about new features first. Your money records never leave this phone.';
  }

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: withAlpha(FeatureColors.violet, 0.12) }]}>
            <MaterialCommunityIcons name="email-heart-outline" size={18} color={FeatureColors.violet} />
          </View>
          <View style={styles.copy}>
            <ThemedText type="defaultBold">Stay in touch</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {status}
            </ThemedText>
          </View>
        </View>

        {joined ? (
          <Button label="Withdraw and delete my details" variant="ghost" onPress={confirmWithdraw} />
        ) : deleting ? null : (
          <Button label="Join" variant="secondary" onPress={openSheet} />
        )}
      </Card>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Stay in touch">
        <StayInTouchForm
          value={form}
          onChange={(next) => {
            setForm(next);
            if (hasErrors(errors)) setErrors({});
          }}
          errors={errors}
          onSubmit={submit}
        />
        <Button label="Join" onPress={submit} />
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  card: { gap: Spacing.three },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.three },
  badge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
});
