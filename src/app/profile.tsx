import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import type { GenderOption, UserProfile } from '@/types/preferences';

const GENDER_CHOICES: { label: string; value: GenderOption; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { label: 'Woman', value: 'woman', icon: 'human-female' },
  { label: 'Man', value: 'man', icon: 'human-male' },
  { label: 'Other', value: '', icon: 'account-outline' },
];

function SettingsLink({
  title,
  detail,
  icon,
  iconColor,
  onPress,
}: {
  title: string;
  detail: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}>
      <View style={[styles.iconBadge, { backgroundColor: `${iconColor}1E` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.linkCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textSecondary} />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, country, updateProfile } = useExpenses();
  const [name, setName] = useState(profile.name);
  const [ageText, setAgeText] = useState(profile.age !== null ? String(profile.age) : '');
  const [gender, setGender] = useState<GenderOption>(profile.gender);
  const [saved, setSaved] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const parsedAge = ageText.trim() === '' ? null : Number(ageText);
  const ageIsValid = parsedAge === null || (Number.isInteger(parsedAge) && parsedAge >= 1 && parsedAge <= 120);

  const save = () => {
    if (!ageIsValid) return;
    const nextProfile: UserProfile = {
      name: name.trim().slice(0, 50),
      age: parsedAge,
      gender,
    };
    updateProfile(nextProfile);
    setSaved(true);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Your profile</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Personalize CashTrack. These details stay private on this device.
          </ThemedText>
        </View>

        {/* Card 1: User Identity Details */}
        <Card style={styles.formCard}>
          <View style={styles.rowFields}>
            <View style={[styles.field, styles.nameField]}>
              <ThemedText type="smallBold">Name</ThemedText>
              <TextInput
                value={name}
                onChangeText={(value) => { setName(value.slice(0, 50)); setSaved(false); }}
                placeholder="What should we call you?"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="words"
                accessibilityLabel="Your name"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
            </View>

            <View style={[styles.field, styles.ageField]}>
              <ThemedText type="smallBold">Age <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
              <TextInput
                value={ageText}
                onChangeText={(value) => { setAgeText(value.replace(/[^0-9]/g, '').slice(0, 3)); setSaved(false); }}
                placeholder="Age"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
                accessibilityLabel="Your age, optional"
                style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
              />
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Gender <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
            <View style={styles.choiceGrid}>
              {GENDER_CHOICES.map((choice) => {
                const selected = gender === choice.value;
                return (
                  <Pressable
                    key={choice.value}
                    onPress={() => { setGender(selected ? '' : choice.value); setSaved(false); }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={choice.label}
                    style={[
                      styles.choice,
                      {
                        borderColor: selected ? theme.accent : theme.border,
                        backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                      },
                    ]}>
                    <MaterialCommunityIcons
                      name={choice.icon}
                      size={18}
                      color={selected ? theme.text : theme.textSecondary}
                    />
                    <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>{choice.label}</ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
          {!ageIsValid && (
            <ThemedText type="caption" themeColor="danger">Enter an age between 1 and 120, or leave it blank.</ThemedText>
          )}

          <Pressable
            onPress={save}
            disabled={!ageIsValid}
            accessibilityRole="button"
            accessibilityState={{ disabled: !ageIsValid }}
            style={({ pressed }) => [styles.saveButton, { backgroundColor: theme.accent }, pressed && styles.pressed, !ageIsValid && styles.disabled]}>
            {saved ? (
              <View style={styles.savedRow}>
                <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                <ThemedText type="defaultBold" style={styles.saveText}>Saved</ThemedText>
              </View>
            ) : (
              <ThemedText type="defaultBold" style={styles.saveText}>Save profile</ThemedText>
            )}
          </Pressable>
        </Card>

        {/* Card 2: App Preferences */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">App Preferences</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Customize region & onboarding</ThemedText>
        </View>

        <Card padded={false}>
          <SettingsLink
            title="Country & currency"
            detail={`${country.name} · ${country.currencyCode} ${country.symbol.trim()}`}
            icon="earth"
            iconColor="#2D9CDB"
            onPress={() => router.push('/country')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink
            title="App tour & guide"
            detail="Replay welcome walkthrough and features guide"
            icon="compass-outline"
            iconColor="#7667F2"
            onPress={() => setShowOnboarding(true)}
          />
        </Card>

        {/* Card 3: About & Support */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">About & Privacy</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">System info & privacy promise</ThemedText>
        </View>

        <Card padded={false}>
          <SettingsLink
            title="About CashTrack & support"
            detail="Privacy promise, version info & developer support"
            icon="information-outline"
            iconColor="#5077C8"
            onPress={() => router.push('/about')}
          />
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.privacyNote}>
          Your profile and expenses are stored locally on this device. CashTrack does not transmit your personal details to external servers.
        </ThemedText>
      </View>
      <OnboardingModal visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 700, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  intro: { gap: Spacing.one },
  title: { fontSize: 30, lineHeight: 36 },
  formCard: { gap: Spacing.two, padding: Spacing.three },
  field: { gap: 4 },
  rowFields: { flexDirection: 'row', gap: Spacing.two },
  nameField: { flex: 1 },
  ageField: { width: 88 },
  input: { minHeight: 40, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, fontSize: 15 },
  choiceGrid: { flexDirection: 'row', gap: Spacing.two },
  choice: { flex: 1, minHeight: 38, borderRadius: Radius.medium, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.one },
  saveButton: { minHeight: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.half },
  savedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  saveText: { color: '#FFFFFF' },
  sectionHeading: { gap: 2, marginTop: Spacing.one },
  linkRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkCopy: { flex: 1, gap: Spacing.half },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.four },
  privacyNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.three, marginTop: Spacing.one },
  linkPressed: { opacity: 0.7 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
