import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

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
  const { profile, country, updateProfile, themeMode, setThemeMode, temperatureUnit, setTemperatureUnit } = useExpenses();
  const [name, setName] = useState(profile.name);
  const [ageText, setAgeText] = useState(profile.age !== null ? String(profile.age) : '');
  const [gender, setGender] = useState<GenderOption>(profile.gender);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>(profile.coverPhotoUri);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>(profile.profilePhotoUri);
  const [saved, setSaved] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const parsedAge = ageText.trim() === '' ? null : Number(ageText);
  const ageIsValid = parsedAge === null || (Number.isInteger(parsedAge) && parsedAge >= 1 && parsedAge <= 120);

  const pickCoverPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access photo library is required to set a cover photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setCoverPhotoUri(result.assets[0].uri);
        setSaved(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert('Permission to access photo library is required to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePhotoUri(result.assets[0].uri);
        setSaved(false);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking profile photo:', error);
    }
  };

  const save = () => {
    if (!ageIsValid) return;
    const nextProfile: UserProfile = {
      name: name.trim().slice(0, 50),
      age: parsedAge,
      gender,
      coverPhotoUri,
      profilePhotoUri,
    };
    updateProfile(nextProfile);
    setSaved(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.container}>
        <View style={styles.intro}>
          <ThemedText type="subtitle" style={styles.title}>Your profile</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Personalize Spendly. These details stay private on this device.
          </ThemedText>
        </View>

        {/* Facebook-style Masterclass Cover & Avatar Card */}
        <Card style={styles.bannerCard} padded={false}>
          <Pressable onPress={pickCoverPhoto} style={styles.coverContainer}>
            {coverPhotoUri ? (
              <Image source={{ uri: coverPhotoUri }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverPlaceholder, { backgroundColor: theme.accent + '20' }]}>
                <MaterialCommunityIcons name="image-plus" size={24} color={theme.accent} />
                <ThemedText type="caption" style={{ color: theme.accent, fontWeight: '600' }}>
                  Tap to add cover photo
                </ThemedText>
              </View>
            )}
            <View style={styles.coverEditOverlay}>
              <MaterialCommunityIcons name="camera" size={14} color="#FFFFFF" />
              <ThemedText type="caption" style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '600' }}>
                Edit Cover
              </ThemedText>
            </View>
          </Pressable>

          <View style={styles.profileSection}>
            <Pressable onPress={pickProfilePhoto} style={styles.avatarWrapper}>
              {profilePhotoUri ? (
                <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                  <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontWeight: 'bold' }}>
                    {name ? name.charAt(0).toUpperCase() : 'S'}
                  </ThemedText>
                </View>
              )}
              <View style={[styles.avatarCameraBadge, { backgroundColor: theme.accent }]}>
                <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
              </View>
            </Pressable>
            <View style={styles.avatarCopy}>
              <ThemedText type="defaultBold" style={{ fontSize: 18 }}>{name || 'Spendly User'}</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">Tap avatar to change profile photo</ThemedText>
            </View>
          </View>
        </Card>

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

        {/* Card 2: App Preferences (including Theme Mode, Temperature Unit & Country) */}
        <View style={styles.sectionHeading}>
          <ThemedText type="defaultBold">App Preferences</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">Customize region, theme & units</ThemedText>
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

          {/* Theme Mode Selector Row */}
          <View style={styles.themeRow}>
            <View style={[styles.iconBadge, { backgroundColor: '#F59E0B1E' }]}>
              <MaterialCommunityIcons
                name={themeMode === 'dark' ? 'weather-night' : themeMode === 'light' ? 'weather-sunny' : 'cellphone'}
                size={22}
                color="#F59E0B"
              />
            </View>
            <View style={styles.linkCopy}>
              <ThemedText type="smallBold">Appearance</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Current: {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
              </ThemedText>
            </View>
            <View style={styles.themeChoiceContainer}>
              {(['system', 'light', 'dark'] as const).map((mode) => {
                const selected = themeMode === mode;
                return (
                  <Pressable
                    key={mode}
                    onPress={() => {
                      setThemeMode(mode);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    style={[
                      styles.themeChoiceBtn,
                      {
                        backgroundColor: selected ? theme.accent : theme.cardMuted,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <ThemedText
                      type="caption"
                      style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '600' }}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* Temperature Unit Selector Row */}
          <View style={styles.themeRow}>
            <View style={[styles.iconBadge, { backgroundColor: '#3B82F61E' }]}>
              <MaterialCommunityIcons name="thermometer" size={22} color="#3B82F6" />
            </View>
            <View style={styles.linkCopy}>
              <ThemedText type="smallBold">Temperature Unit</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Current: {temperatureUnit === 'F' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}
              </ThemedText>
            </View>
            <View style={styles.themeChoiceContainer}>
              {(['F', 'C'] as const).map((unit) => {
                const selected = temperatureUnit === unit;
                return (
                  <Pressable
                    key={unit}
                    onPress={() => {
                      setTemperatureUnit(unit);
                      Haptics.selectionAsync().catch(() => {});
                    }}
                    style={[
                      styles.themeChoiceBtn,
                      {
                        backgroundColor: selected ? theme.accent : theme.cardMuted,
                        borderColor: selected ? theme.accent : theme.border,
                      },
                    ]}>
                    <ThemedText
                      type="caption"
                      style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '600' }}>
                      {unit === 'F' ? '°F' : '°C'}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>

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
            title="About Spendly & support"
            detail="Privacy promise, version info & developer support"
            icon="information-outline"
            iconColor="#5077C8"
            onPress={() => router.push('/about')}
          />
        </Card>

        <ThemedText type="caption" themeColor="textSecondary" style={styles.privacyNote}>
          Your profile and expenses are stored locally on this device. Spendly does not transmit your personal details to external servers.
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
  bannerCard: { overflow: 'hidden', paddingBottom: Spacing.three },
  coverContainer: { height: 130, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', gap: 4 },
  coverEditOverlay: { position: 'absolute', top: 10, right: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  profileSection: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.three, marginTop: -36, gap: Spacing.three },
  avatarWrapper: { position: 'relative', width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#FFFFFF', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarCameraBadge: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarCopy: { flex: 1, justifyContent: 'flex-end', paddingBottom: 6 },
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
  themeRow: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four, paddingVertical: Spacing.two },
  themeChoiceContainer: { flexDirection: 'row', gap: 4 },
  themeChoiceBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.small, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', alignItems: 'center' },
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
