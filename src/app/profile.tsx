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
            Personalize CashTrack. These details stay on this device.
          </ThemedText>
        </View>

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
            <ThemedText type="defaultBold" style={styles.saveText}>{saved ? 'Saved ✓' : 'Save profile'}</ThemedText>
          </Pressable>
        </Card>

        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">Make CashTrack yours</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Organize spending around your life.</ThemedText>
        </View>

        <Card padded={false}>
          <SettingsLink
            title="Country & currency"
            detail={`${country.name} · ${country.currencyCode} ${country.symbol.trim()}`}
            onPress={() => router.push('/country')}
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="App tour & guide" detail="Replay welcome walkthrough and features guide" onPress={() => setShowOnboarding(true)} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Money In" detail="Record salary, freelance, or additional income" onPress={() => router.push('/income')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Money Plan & Pots" detail="Proactive financial planning and savings targets" onPress={() => router.push('/goals')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Lend & borrow" detail="Track money lent and borrowed (IOUs)" onPress={() => router.push('/debts')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Manage categories" detail="Create, rename, or remove categories" onPress={() => router.push('/categories')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Category limits" detail="Set monthly spending limits" onPress={() => router.push('/budgets')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="Advisor & monthly reports" detail="Review budget notices and export a PDF/CSV" onPress={() => router.push('/advisor')} />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <SettingsLink title="About CashTrack & support" detail="Privacy promise and support the developer" onPress={() => router.push('/about')} />
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.privacyNote}>
          Your profile and expenses are stored locally on this device. CashTrack does not need your personal details to track spending.
        </ThemedText>
      </View>
      <OnboardingModal visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </ScrollView>
  );
}

function SettingsLink({ title, detail, onPress }: { title: string; detail: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.linkRow, pressed && styles.linkPressed]}>
      <View style={styles.linkCopy}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">{detail}</ThemedText>
      </View>
      <ThemedText type="subtitle" themeColor="textSecondary" style={styles.chevron}>›</ThemedText>
    </Pressable>
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
  saveText: { color: '#FFFFFF' },
  sectionHeading: { gap: Spacing.one, marginTop: Spacing.one },
  linkRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  linkCopy: { flex: 1, gap: Spacing.half },
  chevron: { fontSize: 24, lineHeight: 28 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: Spacing.four },
  privacyNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.three },
  linkPressed: { opacity: 0.6 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.5 },
});
