import { router } from 'expo-router';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { Card } from '@/components/card';
import { OnboardingModal } from '@/components/onboarding-modal';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, Brand } from '@/constants/theme';
import { COVER_PRESETS, getCoverSource } from '@/constants/cover-presets';
import { useExpenses } from '@/context/expense-context';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import type { GenderOption, UserProfile, FirstDayOfWeek } from '@/types/preferences';
import { generateCsvReport } from '@/utils/csv';

type TabKey = 'identity' | 'preferences' | 'notifications' | 'data';

const GENDER_CHOICES: { label: string; value: GenderOption; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { label: 'Woman', value: 'woman', icon: 'human-female' },
  { label: 'Man', value: 'man', icon: 'human-male' },
  { label: 'Other / Prefer not to say', value: '', icon: 'account-outline' },
];

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function ProfileScreen() {
  const theme = useTheme();
  const {
    expenses,
    profile,
    country,
    customCategories,
    updateProfile,
    themeMode,
    setThemeMode,
    temperatureUnit,
    setTemperatureUnit,
    firstDayOfWeek,
    setFirstDayOfWeek,
    enableBillReminders,
    setEnableBillReminders,
    enableBudgetAlerts,
    setEnableBudgetAlerts,
    enableDailyReminder,
    setEnableDailyReminder,
    resetAllData,
  } = useExpenses();

  const { goals } = useGoals();

  const [activeTab, setActiveTab] = useState<TabKey>('identity');
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio || '');
  const [ageText, setAgeText] = useState(profile.age !== null ? String(profile.age) : '');
  const [gender, setGender] = useState<GenderOption>(profile.gender);
  const [coverPhotoUri, setCoverPhotoUri] = useState<string | undefined>(profile.coverPhotoUri);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | undefined>(profile.profilePhotoUri);

  const [isDirty, setIsDirty] = useState(false);
  const [savedToastVisible, setSavedToastVisible] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);

  const parsedAge = ageText.trim() === '' ? null : Number(ageText);
  const ageIsValid = parsedAge === null || (Number.isInteger(parsedAge) && parsedAge >= 1 && parsedAge <= 120);

  // Profile completion score
  const completionScore = [
    Boolean(name.trim()),
    profilePhotoUri !== undefined,
    coverPhotoUri !== undefined,
    Boolean(bio.trim()),
    parsedAge !== null,
    Boolean(gender),
  ].filter(Boolean).length;

  const completionPercent = Math.round((completionScore / 6) * 100);

  const pickCoverPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Photo library permission is needed to set a cover photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setCoverPhotoUri(result.assets[0].uri);
        setIsDirty(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Photo library permission is needed to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        setProfilePhotoUri(result.assets[0].uri);
        setIsDirty(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error picking profile photo:', error);
    }
  };

  const saveProfileChanges = () => {
    if (!ageIsValid) return;
    const nextProfile: UserProfile = {
      name: name.trim().slice(0, 50),
      bio: bio.trim().slice(0, 150),
      age: parsedAge,
      gender,
      coverPhotoUri,
      profilePhotoUri,
    };
    updateProfile(nextProfile);
    setIsDirty(false);
    setSavedToastVisible(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    setTimeout(() => {
      setSavedToastVisible(false);
    }, 2800);
  };

  const resetChanges = () => {
    triggerHaptic();
    setName(profile.name);
    setBio(profile.bio || '');
    setAgeText(profile.age !== null ? String(profile.age) : '');
    setGender(profile.gender);
    setCoverPhotoUri(profile.coverPhotoUri);
    setProfilePhotoUri(profile.profilePhotoUri);
    setIsDirty(false);
  };

  const handleExportCsv = async () => {
    try {
      triggerHaptic();
      setExporting(true);
      const csvContent = generateCsvReport({
        expenses,
        currencyCode: country.currencyCode,
      });

      if (Platform.OS === 'web') {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `CashTrack_Transactions_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const filename = `CashTrack_Transactions_${Date.now()}.csv`;
        const file = new File(Paths.cache, filename);
        file.create({ overwrite: true });
        file.write(csvContent);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export CashTrack Transactions (CSV)',
          });
        } else {
          Alert.alert('Export Ready', 'CSV file generated successfully.');
        }
      }
    } catch (error) {
      console.error('Export failed', error);
      Alert.alert('Export Error', 'Unable to export transactions right now.');
    } finally {
      setExporting(false);
    }
  };

  const handleResetData = () => {
    triggerHaptic();
    Alert.alert(
      'Reset All Local Data?',
      'This will clear all transactions, goals, debts, and reset settings back to default. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Everything',
          style: 'destructive',
          onPress: async () => {
            await resetAllData();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            }
            Alert.alert('Data Cleared', 'Your account and settings have been reset.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.outerContainer}>
      {/* Toast Notification Banner */}
      {savedToastVisible && (
        <View style={[styles.savedToast, { backgroundColor: '#10B981' }]}>
          <MaterialCommunityIcons name="check-circle" size={18} color="#FFFFFF" />
          <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
            Profile & Settings updated successfully!
          </ThemedText>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          {/* Cover & Avatar Header Card */}
          <Card style={styles.bannerCard} padded={false}>
            {/* Cover Photo Area */}
            <Pressable onPress={() => setIsCoverModalOpen(true)} style={styles.coverContainer}>
              <Image source={getCoverSource(coverPhotoUri)} style={styles.coverImage} />

              {/* Completion Bar Overlay */}
              <View style={styles.completionBarContainer}>
                <View style={styles.completionRow}>
                  <ThemedText type="caption" style={styles.completionText}>
                    Profile Setup: {completionPercent}%
                  </ThemedText>
                </View>
                <View style={styles.completionTrack}>
                  <View
                    style={[
                      styles.completionFill,
                      { width: `${completionPercent}%`, backgroundColor: completionPercent === 100 ? '#10B981' : theme.accent },
                    ]}
                  />
                </View>
              </View>

              {/* Edit Cover Button */}
              <View style={styles.coverEditOverlay}>
                <MaterialCommunityIcons name="image-edit-outline" size={13} color="#FFFFFF" />
                <ThemedText type="caption" style={styles.coverEditText}>
                  Edit Banner
                </ThemedText>
              </View>
            </Pressable>

            {/* Avatar Row (Overlaps Cover Photo Bottom) */}
            <View style={styles.avatarRowContainer}>
              <Pressable
                onPress={pickProfilePhoto}
                style={[styles.avatarWrapper, { borderColor: theme.card, backgroundColor: theme.card }]}>
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                    <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 28 }}>
                      {name ? name.charAt(0).toUpperCase() : 'S'}
                    </ThemedText>
                  </View>
                )}
                <View style={[styles.avatarCameraBadge, { backgroundColor: theme.accent, borderColor: theme.card }]}>
                  <MaterialCommunityIcons name="camera" size={13} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            {/* User Profile Info (Safely BELOW Cover Photo, No Overlapping) */}
            <View style={styles.profileInfoContainer}>
              <View style={styles.nameRow}>
                <ThemedText type="defaultBold" style={styles.displayNameText}>
                  {name.trim() || 'CashTrack User'}
                </ThemedText>
                <View style={[styles.badgePill, { backgroundColor: theme.accentMuted }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={12} color={theme.accent} />
                  <ThemedText type="caption" style={[styles.badgePillText, { color: theme.accent }]}>
                    Private
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.bioText}>
                {bio.trim() || 'Managing finances on device · Private & offline'}
              </ThemedText>
            </View>

            {/* Account Quick Stats Grid Strip */}
            <View style={[styles.statsStrip, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>
                  {expenses.length}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>
                  Logged
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>
                  {country.currencyCode}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>
                  {country.symbol.trim()} Currency
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>
                  {goals.length}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>
                  Active Goals
                </ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>
                  {customCategories.length}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>
                  Custom Tags
                </ThemedText>
              </View>
            </View>
          </Card>

          {/* Segmented Tab Navigation Selector */}
          <View style={[styles.tabBarContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabBarScrollContent}>
              {(
                [
                  { key: 'identity', label: 'Identity', icon: 'account-outline' },
                  { key: 'preferences', label: 'Preferences', icon: 'tune' },
                  { key: 'notifications', label: 'Alerts', icon: 'bell-outline' },
                  { key: 'data', label: 'Data & Privacy', icon: 'database-outline' },
                ] as const
              ).map((tab) => {
                const active = activeTab === tab.key;
                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => {
                      triggerHaptic();
                      setActiveTab(tab.key);
                    }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    style={({ pressed }) => [
                      styles.tabButton,
                      active && [styles.tabButtonActive, { backgroundColor: theme.accentMuted }],
                      pressed && styles.pressed,
                    ]}>
                    <MaterialCommunityIcons
                      name={tab.icon}
                      size={16}
                      color={active ? theme.text : theme.textSecondary}
                    />
                    <ThemedText
                      type="caption"
                      style={{
                        color: active ? theme.text : theme.textSecondary,
                        fontWeight: active ? '700' : '500',
                        fontSize: 12,
                      }}>
                      {tab.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* TAB 1: IDENTITY & PERSONAL DETAILS */}
          {activeTab === 'identity' && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="account-edit-outline" size={20} color={theme.accent} />
                <ThemedText type="defaultBold">Personal Information</ThemedText>
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Full Name</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val.slice(0, 50));
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Alex Johnson"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Personal Financial Goal / Bio <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
                <TextInput
                  value={bio}
                  onChangeText={(val) => {
                    setBio(val.slice(0, 150));
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Saving for house downpayment & emergency fund"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={2}
                  style={[
                    styles.input,
                    styles.multilineInput,
                    { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted },
                  ]}
                />
              </View>

              <View style={styles.rowFields}>
                <View style={[styles.field, { flex: 1 }]}>
                  <ThemedText type="smallBold">Age <ThemedText type="caption" themeColor="textSecondary">(1 - 120)</ThemedText></ThemedText>
                  <TextInput
                    value={ageText}
                    onChangeText={(val) => {
                      setAgeText(val.replace(/[^0-9]/g, '').slice(0, 3));
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 28"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
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
                        onPress={() => {
                          triggerHaptic();
                          setGender(selected ? '' : choice.value);
                          setIsDirty(true);
                        }}
                        style={[
                          styles.choiceBtn,
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
                        <ThemedText type="small" themeColor={selected ? 'text' : 'textSecondary'}>
                          {choice.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {!ageIsValid && (
                <ThemedText type="caption" themeColor="danger">
                  Please enter a valid age between 1 and 120, or leave blank.
                </ThemedText>
              )}
            </Card>
          )}

          {/* TAB 2: APPEARANCE & REGIONAL PREFERENCES */}
          {activeTab === 'preferences' && (
            <View style={styles.tabSectionStack}>
              {/* Theme Mode Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="palette-outline" size={20} color="#F59E0B" />
                  <ThemedText type="defaultBold">App Theme & Styling</ThemedText>
                </View>

                <View style={styles.themeGrid}>
                  {(
                    [
                      { mode: 'system', title: 'System Auto', icon: 'cellphone-cog', desc: 'Match OS dark mode settings' },
                      { mode: 'light', title: 'Light Mode', icon: 'weather-sunny', desc: 'Clean bright layout' },
                      { mode: 'dark', title: 'Dark Mode', icon: 'weather-night', desc: 'OLED friendly dark theme' },
                    ] as const
                  ).map((item) => {
                    const selected = themeMode === item.mode;
                    return (
                      <Pressable
                        key={item.mode}
                        onPress={() => {
                          triggerHaptic();
                          setThemeMode(item.mode);
                        }}
                        style={({ pressed }) => [
                          styles.themeCard,
                          {
                            borderColor: selected ? theme.accent : theme.border,
                            backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <View style={styles.themeCardHeader}>
                          <MaterialCommunityIcons
                            name={item.icon}
                            size={22}
                            color={selected ? theme.accent : theme.textSecondary}
                          />
                          {selected && (
                            <MaterialCommunityIcons name="check-circle" size={16} color={theme.accent} />
                          )}
                        </View>
                        <ThemedText type="smallBold" style={{ marginTop: 4 }}>
                          {item.title}
                        </ThemedText>
                        <ThemedText type="caption" themeColor="textSecondary">
                          {item.desc}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {/* Regional & Currency Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="earth" size={20} color="#2D9CDB" />
                  <ThemedText type="defaultBold">Country & Regional Format</ThemedText>
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/country');
                  }}
                  style={({ pressed }) => [
                    styles.settingRowItem,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#2D9CDB1E' }]}>
                    <MaterialCommunityIcons name="flag-outline" size={20} color="#2D9CDB" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Country & Currency</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {country.name} · {country.currencyCode} ({country.symbol.trim()})
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>

                {/* Temperature Unit Toggle */}
                <View style={[styles.settingRowItem, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#3B82F61E' }]}>
                    <MaterialCommunityIcons name="thermometer" size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Temperature Unit</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Used in weather widgets & reports
                    </ThemedText>
                  </View>
                  <View style={styles.segmentedGroup}>
                    {(['F', 'C'] as const).map((unit) => {
                      const selected = temperatureUnit === unit;
                      return (
                        <Pressable
                          key={unit}
                          onPress={() => {
                            triggerHaptic();
                            setTemperatureUnit(unit);
                          }}
                          style={[
                            styles.segmentedBtn,
                            {
                              backgroundColor: selected ? theme.accent : 'transparent',
                            },
                          ]}>
                          <ThemedText
                            type="caption"
                            style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '700' }}>
                            °{unit}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* First Day of Week */}
                <View style={[styles.settingRowItem, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#10B9811E' }]}>
                    <MaterialCommunityIcons name="calendar-start" size={20} color="#10B981" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">First Day of Week</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      For weekly summary reports
                    </ThemedText>
                  </View>
                  <View style={styles.segmentedGroup}>
                    {(['monday', 'sunday'] as const).map((day) => {
                      const selected = firstDayOfWeek === day;
                      return (
                        <Pressable
                          key={day}
                          onPress={() => {
                            triggerHaptic();
                            setFirstDayOfWeek(day as FirstDayOfWeek);
                          }}
                          style={[
                            styles.segmentedBtn,
                            {
                              backgroundColor: selected ? theme.accent : 'transparent',
                            },
                          ]}>
                          <ThemedText
                            type="caption"
                            style={{ color: selected ? '#FFFFFF' : theme.text, fontWeight: '700' }}>
                            {day === 'monday' ? 'Mon' : 'Sun'}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* TAB 3: NOTIFICATIONS & ALERTS */}
          {activeTab === 'notifications' && (
            <Card style={styles.sectionCard}>
              <View style={styles.cardHeaderRow}>
                <MaterialCommunityIcons name="bell-ring-outline" size={20} color="#EB5757" />
                <ThemedText type="defaultBold">Smart Notifications & Alerts</ThemedText>
              </View>

              <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.rowIconBadge, { backgroundColor: '#EB57571E' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={20} color="#EB5757" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Bill Payment Reminders</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Alert before due dates for upcoming bills & EMIs
                  </ThemedText>
                </View>
                <Switch
                  value={enableBillReminders}
                  onValueChange={(val) => {
                    triggerHaptic();
                    setEnableBillReminders(val);
                  }}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRow, { borderBottomColor: theme.border }]}>
                <View style={[styles.rowIconBadge, { backgroundColor: '#BB6BD91E' }]}>
                  <MaterialCommunityIcons name="scale-balance" size={20} color="#BB6BD9" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Budget Cap Threshold Warnings</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Notify when monthly spending hits 80% & 100% of category caps
                  </ThemedText>
                </View>
                <Switch
                  value={enableBudgetAlerts}
                  onValueChange={(val) => {
                    triggerHaptic();
                    setEnableBudgetAlerts(val);
                  }}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRow}>
                <View style={[styles.rowIconBadge, { backgroundColor: '#7667F21E' }]}>
                  <MaterialCommunityIcons name="notebook-edit-outline" size={20} color="#7667F2" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Daily Expense Log Check-in</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Gentle evening reminder to log today&apos;s cash expenses
                  </ThemedText>
                </View>
                <Switch
                  value={enableDailyReminder}
                  onValueChange={(val) => {
                    triggerHaptic();
                    setEnableDailyReminder(val);
                  }}
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.infoBanner, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="shield-lock-outline" size={18} color={theme.accent} />
                <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1 }}>
                  All notifications run locally on your device. CashTrack does not track or store your push token on remote servers.
                </ThemedText>
              </View>
            </Card>
          )}

          {/* TAB 4: DATA & PRIVACY */}
          {activeTab === 'data' && (
            <View style={styles.tabSectionStack}>
              {/* Data Backup & Export Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="database-sync-outline" size={20} color="#159A8C" />
                  <ThemedText type="defaultBold">Data Export & Backup</ThemedText>
                </View>

                <Pressable
                  onPress={handleExportCsv}
                  disabled={exporting}
                  style={({ pressed }) => [
                    styles.settingRowItem,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#159A8C1E' }]}>
                    <MaterialCommunityIcons name="file-excel-outline" size={20} color="#159A8C" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Export Transactions to CSV</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Download full spreadsheet log of all recorded expenses
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="export-variant" size={20} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowOnboarding(true);
                  }}
                  style={({ pressed }) => [
                    styles.settingRowItem,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#7667F21E' }]}>
                    <MaterialCommunityIcons name="compass-outline" size={20} color="#7667F2" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Replay App Tour & Guide</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Review CashTrack features walkthrough and onboarding
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/about');
                  }}
                  style={({ pressed }) => [
                    styles.settingRowItem,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadge, { backgroundColor: '#5077C81E' }]}>
                    <MaterialCommunityIcons name="information-outline" size={20} color="#5077C8" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">About CashTrack & Support</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      Privacy promise, app version & developer info
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </Pressable>
              </Card>

              {/* Danger Zone */}
              <Card style={[styles.sectionCard, { borderColor: '#FF6B6B40' }]}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#FF6B6B" />
                  <ThemedText type="defaultBold" style={{ color: '#FF6B6B' }}>
                    Danger Zone
                  </ThemedText>
                </View>

                <Pressable
                  onPress={handleResetData}
                  style={({ pressed }) => [
                    styles.resetBtn,
                    { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B60' },
                    pressed && styles.pressed,
                  ]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF6B6B" />
                  <ThemedText type="smallBold" style={{ color: '#FF6B6B' }}>
                    Reset & Wipe All Local Data
                  </ThemedText>
                </Pressable>
              </Card>
            </View>
          )}

          <ThemedText type="caption" themeColor="textSecondary" style={styles.footerNote}>
            CashTrack stores your financial records strictly on device storage. Your data is never uploaded to cloud databases without your explicit consent.
          </ThemedText>
        </View>
      </ScrollView>

      {/* Floating Unsaved Changes Action Bar */}
      {isDirty && (
        <View style={[styles.floatingActionBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.floatingActionCopy}>
            <ThemedText type="smallBold">Unsaved Changes</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Save updates to your profile
            </ThemedText>
          </View>
          <View style={styles.floatingActionButtons}>
            <Pressable
              onPress={resetChanges}
              style={({ pressed }) => [styles.cancelBtn, { borderColor: theme.border }, pressed && styles.pressed]}>
              <ThemedText type="smallBold">Discard</ThemedText>
            </Pressable>
            <Pressable
              onPress={saveProfileChanges}
              disabled={!ageIsValid}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.accent },
                pressed && styles.pressed,
                !ageIsValid && styles.disabled,
              ]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                Save
              </ThemedText>
            </Pressable>
          </View>
        </View>
      )}

      {/* Cover Banner Preset Picker Modal */}
      <Modal
        visible={isCoverModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsCoverModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContentCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialCommunityIcons name="image-multiple" size={22} color={theme.accent} />
                <ThemedText type="subtitle" style={{ fontWeight: '700' }}>
                  Choose Banner Preset
                </ThemedText>
              </View>
              <Pressable onPress={() => setIsCoverModalOpen(false)} style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 12 }}>
              Select a preset banner image or upload your custom photo.
            </ThemedText>

            <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
              <View style={styles.presetGrid}>
                {COVER_PRESETS.map((preset) => {
                  const activeUri = coverPhotoUri || 'default-cover';
                  const isSelected = activeUri === preset.uri || (!coverPhotoUri && preset.id === 'default-cover');
                  return (
                    <Pressable
                      key={preset.id}
                      style={[
                        styles.presetCard,
                        { borderColor: isSelected ? theme.accent : theme.border, backgroundColor: theme.cardMuted },
                        isSelected && { borderWidth: 2 },
                      ]}
                      onPress={() => {
                        setCoverPhotoUri(preset.uri);
                        setIsDirty(true);
                        triggerHaptic();
                        setIsCoverModalOpen(false);
                      }}
                    >
                      <Image source={getCoverSource(preset.uri)} style={styles.presetThumbnail} />
                      <View style={styles.presetMeta}>
                        <ThemedText type="smallBold">{preset.name}</ThemedText>
                        <ThemedText type="caption" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 11 }}>
                          {preset.description}
                        </ThemedText>
                      </View>
                      {isSelected && (
                        <View style={[styles.selectedCheckBadge, { backgroundColor: theme.accent }]}>
                          <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ marginTop: 16 }}>
              <Pressable
                onPress={() => {
                  setIsCoverModalOpen(false);
                  setTimeout(() => pickCoverPhoto(), 300);
                }}
                style={[styles.modalActionBtn, { backgroundColor: Brand.primary }]}
              >
                <MaterialCommunityIcons name="image-plus" size={18} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Upload Custom Photo from Gallery
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <OnboardingModal visible={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 110 },
  container: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
  },
  savedToast: {
    position: 'absolute',
    top: 12,
    left: 20,
    right: 20,
    zIndex: 999,
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerCard: { overflow: 'hidden', paddingBottom: Spacing.three },
  coverContainer: { height: 150, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  coverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  completionBarContainer: {
    position: 'absolute',
    top: 10,
    left: 12,
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.medium,
  },
  completionRow: { flexDirection: 'row', alignItems: 'center' },
  completionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  completionTrack: { width: 80, height: 4, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 2 },
  coverEditOverlay: {
    position: 'absolute',
    top: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    gap: 4,
  },
  coverEditText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },
  avatarRowContainer: {
    paddingHorizontal: Spacing.three,
    marginTop: -42, // Only the avatar circle overlaps the cover photo!
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    position: 'relative',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 40, resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfoContainer: {
    paddingHorizontal: Spacing.three,
    marginTop: Spacing.two,
    gap: 4,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  displayNameText: { fontSize: 22, fontWeight: '800', lineHeight: 28 },
  bioText: { fontSize: 13, lineHeight: 18 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  badgePillText: { fontSize: 10, fontWeight: '700' },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginTop: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statNumber: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 10 },
  statDivider: { width: StyleSheet.hairlineWidth, height: '60%' },
  tabBarContainer: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  tabBarScrollContent: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.small,
  },
  tabButtonActive: {
    borderRadius: Radius.small,
  },
  tabSectionStack: { gap: Spacing.three },
  sectionCard: { gap: Spacing.two, padding: Spacing.three },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  field: { gap: 4 },
  rowFields: { flexDirection: 'row', gap: Spacing.two },
  input: {
    minHeight: 42,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  multilineInput: { minHeight: 64, paddingTop: 8, paddingBottom: 8, textAlignVertical: 'top' },
  choiceGrid: { flexDirection: 'column', gap: 6 },
  choiceBtn: {
    minHeight: 40,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  themeGrid: { gap: Spacing.two },
  themeCard: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.two,
    gap: 2,
  },
  themeCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settingRowItem: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    gap: Spacing.three,
  },
  rowIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: { flex: 1, gap: 1 },
  segmentedGroup: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.06)',
    padding: 2,
    borderRadius: Radius.small,
  },
  segmentedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.small - 1,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchCopy: { flex: 1, gap: 2 },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 4,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerNote: { textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.three, marginTop: Spacing.one },
  floatingActionBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    maxWidth: 720,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  floatingActionCopy: { gap: 1 },
  floatingActionButtons: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.medium,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContentCard: {
    width: '100%',
    maxWidth: 480,
    borderRadius: Radius.xlarge,
    borderWidth: 1,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  modalCloseBtn: {
    padding: 4,
  },
  presetGrid: {
    gap: 10,
  },
  presetCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetThumbnail: {
    width: 80,
    height: 52,
    resizeMode: 'cover',
  },
  presetMeta: {
    flex: 1,
    paddingHorizontal: 12,
  },
  selectedCheckBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.medium,
    gap: 8,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
