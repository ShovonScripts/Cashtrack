import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, type ComponentRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ExternalLink } from '@/components/external-link';
import { ThemedText } from '@/components/themed-text';
import { FormField } from '@/components/ui';
import { PRIVACY_POLICY_URL } from '@/constants/privacy-policy';
import { MinTouchTarget, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { EMAIL_MAX, NAME_MAX, PHONE_MAX, type SignupErrors, type SignupInput } from '@/utils/signup';

type Props = {
  value: SignupInput;
  onChange: (next: SignupInput) => void;
  errors: SignupErrors;
  /** Called from the keyboard's "done" on the last field. */
  onSubmit?: () => void;
};

/**
 * The optional "Stay in touch" fields. Controlled: the parent owns the values
 * and decides when to validate and submit. Name and email are required to
 * join; phone is optional; the updates checkbox starts unticked.
 */
export function StayInTouchForm({ value, onChange, errors, onSubmit }: Props) {
  const theme = useTheme();
  const emailRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);

  const set = (patch: Partial<SignupInput>) => onChange({ ...value, ...patch });

  return (
    <View style={styles.stack}>
      <FormField
        label="Name"
        value={value.name}
        onChangeText={(name) => set({ name })}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={NAME_MAX}
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
        error={errors.name}
      />
      <FormField
        label="Email"
        inputRef={emailRef}
        value={value.email}
        onChangeText={(email) => set({ email })}
        placeholder="name@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        maxLength={EMAIL_MAX}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
        error={errors.email}
      />
      <FormField
        label="Phone (optional)"
        inputRef={phoneRef}
        value={value.phone}
        onChangeText={(phone) => set({ phone })}
        placeholder="+880 1712 345678"
        keyboardType="phone-pad"
        autoComplete="tel"
        textContentType="telephoneNumber"
        maxLength={PHONE_MAX}
        returnKeyType="done"
        onSubmitEditing={onSubmit}
        error={errors.phone}
        helper="Include your country code."
      />

      <Pressable
        onPress={() => set({ consent: !value.consent })}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: value.consent }}
        accessibilityLabel="Send me product updates and tips from CashTrack"
        style={({ pressed }) => [styles.consentRow, pressed && PressFeedback]}>
        <MaterialCommunityIcons
          name={value.consent ? 'checkbox-marked' : 'checkbox-blank-outline'}
          size={24}
          color={value.consent ? theme.accent : theme.textSecondary}
        />
        <ThemedText type="small" style={styles.consentText}>
          Send me product updates and tips. I can stop them any time.
        </ThemedText>
      </Pressable>

      <View style={[styles.note, { backgroundColor: theme.accentMuted }]}>
        <MaterialCommunityIcons name="shield-lock-outline" size={18} color={theme.accent} />
        <ThemedText type="caption" style={styles.noteText}>
          We receive only what you type here, plus your country. Your money records never leave this phone. You can
          withdraw and delete these details in {'Profile & settings'}.{' '}
          <ExternalLink href={PRIVACY_POLICY_URL} style={{ color: theme.accent, fontWeight: '600' }}>
            Privacy policy
          </ExternalLink>
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: Spacing.three },
  consentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: MinTouchTarget,
  },
  consentText: { flex: 1 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.medium,
  },
  noteText: { flex: 1 },
});
