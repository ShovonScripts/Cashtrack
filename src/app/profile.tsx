import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
  Switch,
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
import { COVER_PRESETS, DEFAULT_COVER_KEY, DEFAULT_COVER_URI, getCoverSource } from '@/constants/cover-presets';
import { useDebts } from '@/context/debt-context';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useGoals } from '@/context/goal-context';
import { useIncome } from '@/context/income-context';
import { useTheme } from '@/hooks/use-theme';
import { BACKUP_MIME_TYPE, createBackup, pickBackupFile, restoreBackup } from '@/storage/backup-service';
import { BackupParseError, parseBackup } from '@/utils/backup';
import type { GenderOption, UserProfile, FirstDayOfWeek } from '@/types/preferences';
import { generateCsvReport } from '@/utils/csv';
import { requestQuoteNotificationPermissionsAsync } from '@/utils/quote-notifications';
import {
  requestNotificationPermissionsAsync,
  scheduleTestAlarmNotificationAsync,
} from '@/utils/reminder-notifications';
import { requestSpendingReminderPermissionsAsync } from '@/utils/spending-reminder-notifications';
import { registerForBudgetNotificationsAsync } from '@/utils/notifications';
import { confirmAction, notify } from '@/utils/confirm';
import { deleteLocalFile } from '@/utils/local-file';
import { RestoreRollbackError } from '@/utils/restore-rollback';

type TabKey = 'identity' | 'preferences' | 'notifications' | 'data';

const GENDER_CHOICES: { label: string; value: GenderOption; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { label: 'Woman', value: 'woman', icon: 'human-female' },
  { label: 'Man', value: 'man', icon: 'human-male' },
  { label: 'Other', value: 'other', icon: 'account-outline' },
];

async function persistPickedImage(uri: string, prefix: string): Promise<string> {
  if (Platform.OS === 'web') return uri;
  const extension = uri.split('?')[0].split('.').pop() || 'jpg';
  const target = new File(Paths.document, `${prefix}-${Date.now()}.${extension}`);
  try {
    await new File(uri).copy(target);
    if (!target.exists) {
      throw new Error('The copied image file is missing.');
    }
    return target.uri;
  } catch (error) {
    await deleteLocalFile(target.uri);
    throw error;
  }
}

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

export default function ProfileScreen() {
  const theme = useTheme();
  const { expenses, resetAllData, reloadAllData } = useExpenses();
  const {
    preferences,
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
    enableDailyQuotes,
    setEnableDailyQuotes,
    appLockEnabled,
  } = usePreferences();

  const { goals, reloadGoals } = useGoals();
  const { debts, reloadDebts } = useDebts();
  const { reloadIncome } = useIncome();
  const { reloadReminders } = useFinancialReminders();

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
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [testingAlarm, setTestingAlarm] = useState(false);
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
        notify('Permission Required', 'Photo library permission is needed to set a cover photo.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const previousDraft = coverPhotoUri;
        const nextUri = await persistPickedImage(result.assets[0].uri, 'cover');
        if (previousDraft && previousDraft !== profile.coverPhotoUri) {
          await deleteLocalFile(previousDraft);
        }
        setCoverPhotoUri(nextUri);
        setIsDirty(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error picking cover photo:', error);
      notify('Photo Not Saved', 'Could not save the selected cover photo. Please try again.');
    }
  };

  const pickProfilePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        notify('Permission Required', 'Photo library permission is needed to set a profile picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]?.uri) {
        const previousDraft = profilePhotoUri;
        const nextUri = await persistPickedImage(result.assets[0].uri, 'avatar');
        if (previousDraft && previousDraft !== profile.profilePhotoUri) {
          await deleteLocalFile(previousDraft);
        }
        setProfilePhotoUri(nextUri);
        setIsDirty(true);
        triggerHaptic();
      }
    } catch (error) {
      console.error('Error picking profile photo:', error);
      notify('Photo Not Saved', 'Could not save the selected profile photo. Please try again.');
    }
  };

  const saveProfileChanges = async () => {
    if (!ageIsValid) return;
    const previousCover = profile.coverPhotoUri;
    const previousAvatar = profile.profilePhotoUri;
    const nextProfile: UserProfile = {
      name: name.trim().slice(0, 50),
      bio: bio.trim().slice(0, 150),
      age: parsedAge,
      gender,
      coverPhotoUri,
      profilePhotoUri,
    };

    const saved = await updateProfile(nextProfile);
    if (!saved) {
      notify('Save Failed', 'Your profile changes could not be saved. Please try again.');
      return;
    }

    if (previousCover !== nextProfile.coverPhotoUri) {
      await deleteLocalFile(previousCover);
    }
    if (previousAvatar !== nextProfile.profilePhotoUri) {
      await deleteLocalFile(previousAvatar);
    }

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
    if (coverPhotoUri !== profile.coverPhotoUri) {
      void deleteLocalFile(coverPhotoUri);
    }
    if (profilePhotoUri !== profile.profilePhotoUri) {
      void deleteLocalFile(profilePhotoUri);
    }
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
          notify('Export Ready', 'CSV file generated successfully.');
        }
      }
    } catch (error) {
      console.error('Export failed', error);
      notify('Export Error', 'Unable to export transactions right now.');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    triggerHaptic();
    setBackingUp(true);
    try {
      const backup = await createBackup({ expenses, preferences, debts });

      if (Platform.OS === 'web') {
        const blob = new Blob([backup.json], { type: BACKUP_MIME_TYPE });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', backup.fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const file = new File(Paths.cache, backup.fileName);
        file.create({ overwrite: true });
        file.write(backup.json);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, {
            mimeType: BACKUP_MIME_TYPE,
            dialogTitle: 'Save CashTrack Backup',
          });
        }
      }

      const skipped = backup.omittedAttachments > 0
        ? ` ${backup.omittedAttachments} photo(s) could not be included.`
        : '';
      notify(
        'Backup Ready',
        `All data was saved to ${backup.fileName}.${skipped}`,
      );
    } catch (error) {
      console.error('[cashtrack] Backup failed', error);
      notify('Backup Failed', 'Could not create a backup file. Please try again.');
    } finally {
      setBackingUp(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (Platform.OS === 'web') {
      notify('Not Available', 'Restoring a backup is available in the iOS and Android app.');
      return;
    }

    triggerHaptic();
    setRestoring(true);
    try {
      const raw = await pickBackupFile();
      if (raw === null) {
        setRestoring(false);
        return;
      }

      const preview = parseBackup(raw);
      setRestoring(false);

      const summary = [
        `${preview.data.expenses.length} expenses`,
        `${preview.data.income.length} income entries`,
        `${preview.data.debts.length} debts`,
        `${preview.data.goals.length} pots/goals`,
        `${preview.data.reminders.length} bills`,
        `${preview.data.notes.length} notes`,
      ].join(', ');

      confirmAction(
        'Restore From Backup?',
        `This will REPLACE everything currently on this device with the backup from ${preview.exportedAt.slice(0, 10)} (${summary}). This cannot be undone.`,
        async () => {
          setRestoring(true);
          try {
            const result = await restoreBackup(raw);
            reloadAllData();
            reloadDebts();
            reloadIncome();
            reloadGoals();
            reloadReminders();
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            notify(
              'Backup Restored',
              `${result.counts.expenses} expenses, ${result.counts.income} income entries, ${result.counts.goals} pots and ${result.counts.reminders} bills were restored.`,
            );
            router.replace('/(tabs)/menu');
          } catch (error) {
            console.error('[cashtrack] Restore failed', error);
            if (!(error instanceof RestoreRollbackError)) {
              reloadAllData();
              reloadDebts();
              reloadIncome();
              reloadGoals();
              reloadReminders();
            }
            notify(
              'Restore Failed',
              error instanceof RestoreRollbackError
                ? 'The backup could not be applied and your previous data could not be fully recovered. Restart the app before making changes.'
                : 'The backup could not be applied. Your previous data was kept.',
            );
          } finally {
            setRestoring(false);
          }
        },
        'Replace All Data',
      );
    } catch (error) {
      setRestoring(false);
      notify(
        'Restore Failed',
        error instanceof BackupParseError
          ? error.message
          : 'That file could not be read. Choose a CashTrack backup file.',
      );
    }
  };

  const handleTestAlarm = async () => {
    triggerHaptic();
    setTestingAlarm(true);
    try {
      const scheduled = await scheduleTestAlarmNotificationAsync();
      if (scheduled) {
        notify(
          'Test Alarm Scheduled',
          'A test notification will arrive in 5 seconds. Turn off Silent mode to hear it.'
        );
      } else {
        notify(
          'Notifications are off',
          'Allow notifications for CashTrack in your device settings to test the alarm sound.'
        );
      }
    } finally {
      setTestingAlarm(false);
    }
  };

  const handleResetData = () => {
    triggerHaptic();
    confirmAction(
      '⚠️ Reset All Local Data?',
      'This will permanently delete all your transactions, notes, goals, debts, and reset settings back to default.',
      () => {
        confirmAction(
          'Final Confirmation',
          'Are you 100% sure? This action cannot be undone.',
          async () => {
            try {
              await resetAllData();
              if (coverPhotoUri !== profile.coverPhotoUri) {
                await deleteLocalFile(coverPhotoUri);
              }
              if (profilePhotoUri !== profile.profilePhotoUri) {
                await deleteLocalFile(profilePhotoUri);
              }
              setName('');
              setBio('');
              setAgeText('');
              setGender('');
              setCoverPhotoUri(undefined);
              setProfilePhotoUri(undefined);
              setIsDirty(false);
              setSavedToastVisible(false);
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
              }
              notify('Data Cleared', 'Your account and settings have been reset.');
            } catch (error) {
              console.error('[cashtrack] Failed to reset all data', error);
              notify('Reset Failed', 'Could not reset all data. Please try again.');
            }
          },
          'Wipe Everything',
        );
      },
      'I understand, proceed',
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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.container}>
          {/* Cover & Avatar Header Card */}
          <Card style={styles.bannerCard} padded={false}>
            {/* Cover Photo Area */}
            <Pressable
              onPress={() => setIsCoverModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel="Edit cover banner"
              style={styles.coverContainer}>
              <Image source={getCoverSource(coverPhotoUri)} style={styles.coverImage} />

              {/* Completion Bar Overlay */}
              <View style={styles.completionBarContainer}>
                <View style={styles.completionRow}>
                  <ThemedText type="caption" style={styles.completionText}>
                    Setup: {completionPercent}%
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
                <MaterialCommunityIcons name="image-edit-outline" size={12} color="#FFFFFF" />
                <ThemedText type="caption" style={styles.coverEditText}>
                  Banner
                </ThemedText>
              </View>
            </Pressable>

            {/* Avatar Row */}
            <View style={styles.avatarRowContainer}>
              <Pressable
                onPress={pickProfilePhoto}
                accessibilityRole="button"
                accessibilityLabel="Upload profile photo"
                style={[styles.avatarWrapper, { borderColor: theme.card, backgroundColor: theme.card }]}>
                {profilePhotoUri ? (
                  <Image source={{ uri: profilePhotoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accentFill }]}>
                    <ThemedText type="subtitle" style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 24 }}>
                      {name ? name.charAt(0).toUpperCase() : 'S'}
                    </ThemedText>
                  </View>
                )}
                <View style={[styles.avatarCameraBadge, { backgroundColor: theme.accentFill, borderColor: theme.card }]}>
                  <MaterialCommunityIcons name="camera" size={12} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>

            {/* User Profile Info */}
            <View style={styles.profileInfoContainer}>
              <View style={styles.nameRow}>
                <ThemedText type="defaultBold" style={styles.displayNameText}>
                  {name.trim() || 'CashTrack User'}
                </ThemedText>
                <View style={[styles.badgePill, { backgroundColor: theme.accentMuted }]}>
                  <MaterialCommunityIcons name="shield-check-outline" size={11} color={theme.accent} />
                  <ThemedText type="caption" style={[styles.badgePillText, { color: theme.accent }]}>
                    Private
                  </ThemedText>
                </View>
              </View>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.bioText} numberOfLines={2}>
                {bio.trim() || 'Managing finances on device · Private & offline'}
              </ThemedText>
            </View>

            {/* Account Quick Stats Grid Strip */}
            <View style={[styles.statsStrip, { borderColor: theme.border, backgroundColor: theme.cardMuted }]}>
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>{expenses.length}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>Logged</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>{country.currencyCode}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>Currency</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>{goals.length}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>Pots</ThemedText>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.statBox}>
                <ThemedText type="defaultBold" style={styles.statNumber}>{customCategories.length}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.statLabel}>Tags</ThemedText>
              </View>
            </View>
          </Card>

          {/* Segmented Tab Navigation Selector */}
          <View style={[styles.tabBarContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabBarScrollContent}>
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
                      size={15}
                      color={active ? theme.accent : theme.textSecondary}
                    />
                    <ThemedText
                      type="caption"
                      style={{
                        color: active ? theme.text : theme.textSecondary,
                        fontWeight: active ? '700' : '500',
                        fontSize: 11.5,
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
                <MaterialCommunityIcons name="account-edit-outline" size={18} color={theme.accent} />
                <ThemedText type="defaultBold">Personal Information</ThemedText>
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Nickname</ThemedText>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val.slice(0, 50));
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Alex"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
                  accessibilityLabel="Nickname"
                  style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
                />
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Financial Goal / Bio <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
                <TextInput
                  value={bio}
                  onChangeText={(val) => {
                    setBio(val.slice(0, 150));
                    setIsDirty(true);
                  }}
                  placeholder="e.g. Saving for house & emergency fund"
                  placeholderTextColor={theme.textSecondary}
                  accessibilityLabel="Financial goal or bio"
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
                  <ThemedText type="smallBold">Age <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
                  <TextInput
                    value={ageText}
                    onChangeText={(val) => {
                      setAgeText(val.replace(/[^0-9]/g, '').slice(0, 3));
                      setIsDirty(true);
                    }}
                    placeholder="e.g. 28"
                    placeholderTextColor={theme.textSecondary}
                    keyboardType="number-pad"
                    accessibilityLabel="Age"
                    style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.cardMuted }]}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <ThemedText type="smallBold">Gender <ThemedText type="caption" themeColor="textSecondary">(opt.)</ThemedText></ThemedText>
                <View style={styles.choiceGridHorizontal}>
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
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={[
                          styles.choiceBtnCompact,
                          {
                            borderColor: selected ? theme.accent : theme.border,
                            backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                          },
                        ]}>
                        <MaterialCommunityIcons
                          name={choice.icon}
                          size={16}
                          color={selected ? theme.accent : theme.textSecondary}
                        />
                        <ThemedText type="caption" style={{ color: selected ? theme.text : theme.textSecondary, fontWeight: selected ? '700' : '500' }}>
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
                  <MaterialCommunityIcons name="palette-outline" size={18} color="#F59E0B" />
                  <ThemedText type="defaultBold">App Theme & Styling</ThemedText>
                </View>

                <View style={styles.themeGridHorizontal}>
                  {(
                    [
                      { mode: 'system', title: 'Auto', icon: 'cellphone-cog' },
                      { mode: 'light', title: 'Light', icon: 'weather-sunny' },
                      { mode: 'dark', title: 'Dark', icon: 'weather-night' },
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
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        style={({ pressed }) => [
                          styles.themeCardCompact,
                          {
                            borderColor: selected ? theme.accent : theme.border,
                            backgroundColor: selected ? theme.accentMuted : theme.cardMuted,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={18}
                          color={selected ? theme.accent : theme.textSecondary}
                        />
                        <ThemedText type="caption" style={{ fontWeight: selected ? '700' : '600', color: selected ? theme.text : theme.textSecondary }}>
                          {item.title}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {/* Privacy & Security Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="shield-lock-outline" size={18} color="#159A8C" />
                  <ThemedText type="defaultBold">Privacy & Security</ThemedText>
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/app-lock');
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#159A8C1E' }]}>
                    <MaterialCommunityIcons name="cellphone-lock" size={17} color="#159A8C" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">App Lock</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {appLockEnabled ? 'On · Unlock with device security' : 'Off · Protect your data'}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>
              </Card>

              {/* Regional & Currency Card */}
              <Card style={styles.sectionCard}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="earth" size={18} color="#2D9CDB" />
                  <ThemedText type="defaultBold">Country & Regional Format</ThemedText>
                </View>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/country');
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#2D9CDB1E' }]}>
                    <MaterialCommunityIcons name="flag-outline" size={17} color="#2D9CDB" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Country & Currency</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {country.name} · {country.currencyCode} ({country.symbol.trim()})
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>

                {/* Temperature Unit Toggle */}
                <View style={[styles.settingRowItemCompact, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#3B82F61E' }]}>
                    <MaterialCommunityIcons name="thermometer" size={17} color="#3B82F6" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Temperature Unit</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Widgets & reports</ThemedText>
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
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={[
                            styles.segmentedBtnCompact,
                            { backgroundColor: selected ? theme.accentFill : 'transparent' },
                          ]}>
                          <ThemedText type="caption" style={{ color: selected ? theme.onBrand : theme.text, fontWeight: '700' }}>
                            °{unit}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* First Day of Week */}
                <View style={[styles.settingRowItemCompact, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#10B9811E' }]}>
                    <MaterialCommunityIcons name="calendar-start" size={17} color="#10B981" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">First Day of Week</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Weekly summary reports</ThemedText>
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
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          style={[
                            styles.segmentedBtnCompact,
                            { backgroundColor: selected ? theme.accentFill : 'transparent' },
                          ]}>
                          <ThemedText type="caption" style={{ color: selected ? theme.onBrand : theme.text, fontWeight: '700' }}>
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
                <MaterialCommunityIcons name="bell-ring-outline" size={18} color="#EB5757" />
                <ThemedText type="defaultBold">Smart Notifications & Alerts</ThemedText>
              </View>

              <View style={[styles.switchRowCompact, { borderBottomColor: theme.border }]}>
                <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#EB57571E' }]}>
                  <MaterialCommunityIcons name="calendar-clock" size={17} color="#EB5757" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Bill Reminders</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">Upcoming bills & EMIs</ThemedText>
                </View>
                <Switch
                  value={enableBillReminders}
                  onValueChange={async (val) => {
                    triggerHaptic();
                    if (val) {
                      const granted = await requestNotificationPermissionsAsync();
                      if (!granted) {
                        notify(
                          'Notifications are off',
                          'Allow notifications for CashTrack in your device settings to receive bill reminders.'
                        );
                        return;
                      }
                    }
                    setEnableBillReminders(val);
                  }}
                  accessibilityLabel="Bill payment reminders"
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRowCompact, { borderBottomColor: theme.border }]}>
                <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#BB6BD91E' }]}>
                  <MaterialCommunityIcons name="scale-balance" size={17} color="#BB6BD9" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Budget Caps</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">80% & 100% cap warnings</ThemedText>
                </View>
                <Switch
                  value={enableBudgetAlerts}
                  onValueChange={(val) => {
                    triggerHaptic();
                    if (val) void registerForBudgetNotificationsAsync();
                    setEnableBudgetAlerts(val);
                  }}
                  accessibilityLabel="Budget cap threshold warnings"
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={styles.switchRowCompact}>
                <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#7667F21E' }]}>
                  <MaterialCommunityIcons name="notebook-edit-outline" size={17} color="#7667F2" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Daily Check-in</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">Evening logging reminder</ThemedText>
                </View>
                <Switch
                  value={enableDailyReminder}
                  onValueChange={async (val) => {
                    triggerHaptic();
                    if (val) {
                      const granted = await requestSpendingReminderPermissionsAsync();
                      if (!granted) {
                        notify(
                          'Notifications are off',
                          'Allow notifications for CashTrack in your device settings to receive the daily check-in.'
                        );
                        return;
                      }
                    }
                    setEnableDailyReminder(val);
                  }}
                  accessibilityLabel="Daily expense log check-in"
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.switchRowCompact, { borderBottomColor: theme.border }]}>
                <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#F2994A1E' }]}>
                  <MaterialCommunityIcons name="weather-sunny" size={17} color="#F2994A" />
                </View>
                <View style={styles.switchCopy}>
                  <ThemedText type="smallBold">Daily Motivation</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">Morning quote at 8:00 AM</ThemedText>
                </View>
                <Switch
                  value={enableDailyQuotes}
                  onValueChange={async (val) => {
                    triggerHaptic();
                    if (val) {
                      const granted = await requestQuoteNotificationPermissionsAsync();
                      if (!granted) {
                        notify(
                          'Notifications are off',
                          'Allow notifications for CashTrack in your device settings to receive the daily quote.'
                        );
                        return;
                      }
                    }
                    setEnableDailyQuotes(val);
                  }}
                  accessibilityLabel="Daily motivation quote notification"
                  trackColor={{ false: theme.border, true: theme.accent }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <Pressable
                onPress={handleTestAlarm}
                disabled={testingAlarm}
                accessibilityRole="button"
                accessibilityLabel="Send a test alarm notification"
                accessibilityState={{ disabled: testingAlarm }}
                style={({ pressed }) => [
                  styles.settingRowItemCompact,
                  { backgroundColor: theme.cardMuted, borderColor: theme.border, marginTop: Spacing.two },
                  pressed && styles.pressed,
                ]}>
                <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#EB57571E' }]}>
                  {testingAlarm ? (
                    <ActivityIndicator size="small" color="#EB5757" />
                  ) : (
                    <MaterialCommunityIcons name="bell-alert-outline" size={17} color="#EB5757" />
                  )}
                </View>
                <View style={styles.rowCopy}>
                  <ThemedText type="smallBold">Test Alarm Sound</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Sends a notification in 5 seconds
                  </ThemedText>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
              </Pressable>

              <View style={[styles.infoBannerCompact, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
                <MaterialCommunityIcons name="shield-lock-outline" size={15} color={theme.accent} />
                <ThemedText type="caption" themeColor="textSecondary" style={{ flex: 1, fontSize: 11 }}>
                  Local execution only · No push tokens uploaded to cloud servers.
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
                  <MaterialCommunityIcons name="database-sync-outline" size={18} color="#159A8C" />
                  <ThemedText type="defaultBold">Data Export & Backup</ThemedText>
                </View>

                <Pressable
                  onPress={handleExportCsv}
                  disabled={exporting}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: exporting }}
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#159A8C1E' }]}>
                    {exporting ? (
                      <ActivityIndicator size="small" color="#159A8C" />
                    ) : (
                      <MaterialCommunityIcons name="file-excel-outline" size={17} color="#159A8C" />
                    )}
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Export CSV Spreadsheet</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Full recorded expense ledger</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="export-variant" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={handleCreateBackup}
                  disabled={backingUp || restoring}
                  accessibilityRole="button"
                  accessibilityLabel="Back up all data"
                  accessibilityState={{ disabled: backingUp || restoring }}
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#159A8C1E' }]}>
                    {backingUp ? (
                      <ActivityIndicator size="small" color="#159A8C" />
                    ) : (
                      <MaterialCommunityIcons name="database-export-outline" size={17} color="#159A8C" />
                    )}
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Back Up All Data</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      JSON file with photos & receipts
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="export-variant" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={handleRestoreBackup}
                  disabled={backingUp || restoring}
                  accessibilityRole="button"
                  accessibilityLabel="Restore from backup"
                  accessibilityState={{ disabled: backingUp || restoring }}
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#F2994A1E' }]}>
                    {restoring ? (
                      <ActivityIndicator size="small" color="#F2994A" />
                    ) : (
                      <MaterialCommunityIcons name="database-import-outline" size={17} color="#F2994A" />
                    )}
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Restore From Backup</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {Platform.OS === 'web'
                        ? 'Available in the iOS & Android app'
                        : 'Replace all data on this device'}
                    </ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    setShowOnboarding(true);
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#7667F21E' }]}>
                    <MaterialCommunityIcons name="compass-outline" size={17} color="#7667F2" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">Replay App Walkthrough</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Onboarding tour & tips</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/user-manual');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Open the user manual"
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#0EA5E91E' }]}>
                    <MaterialCommunityIcons name="book-open-page-variant-outline" size={17} color="#0EA5E9" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">User Manual</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Searchable guide to every feature</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>

                <Pressable
                  onPress={() => {
                    triggerHaptic();
                    router.push('/about');
                  }}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.settingRowItemCompact,
                    { backgroundColor: theme.cardMuted, borderColor: theme.border },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.rowIconBadgeCompact, { backgroundColor: '#5077C81E' }]}>
                    <MaterialCommunityIcons name="information-outline" size={17} color="#5077C8" />
                  </View>
                  <View style={styles.rowCopy}>
                    <ThemedText type="smallBold">About CashTrack</ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">Privacy promise & version</ThemedText>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                </Pressable>
              </Card>

              {/* Danger Zone */}
              <Card style={[styles.sectionCard, { borderColor: '#FF6B6B40' }]}>
                <View style={styles.cardHeaderRow}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF6B6B" />
                  <ThemedText type="defaultBold" style={{ color: '#FF6B6B' }}>Danger Zone</ThemedText>
                </View>

                <Pressable
                  onPress={handleResetData}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.resetBtnCompact,
                    { backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B60' },
                    pressed && styles.pressed,
                  ]}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF6B6B" />
                  <ThemedText type="smallBold" style={{ color: '#FF6B6B' }}>
                    Wipe All Local Data
                  </ThemedText>
                </Pressable>
              </Card>
            </View>
          )}

          <ThemedText type="caption" themeColor="textSecondary" style={styles.footerNote}>
            CashTrack is 100% local-first. Your financial records never leave your device.
          </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Unsaved Changes Action Bar */}
      {isDirty && (
        <View style={[styles.floatingActionBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.floatingActionCopy}>
            <ThemedText type="smallBold">Unsaved Changes</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">Save updates</ThemedText>
          </View>
          <View style={styles.floatingActionButtons}>
            <Pressable
              onPress={resetChanges}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancelBtn, { borderColor: theme.border }, pressed && styles.pressed]}>
              <ThemedText type="smallBold">Discard</ThemedText>
            </Pressable>
            <Pressable
              onPress={saveProfileChanges}
              disabled={!ageIsValid}
              accessibilityRole="button"
              accessibilityState={{ disabled: !ageIsValid }}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: theme.accentFill },
                pressed && styles.pressed,
                !ageIsValid && styles.disabled,
              ]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Save</ThemedText>
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
                <MaterialCommunityIcons name="image-multiple" size={20} color={theme.accent} />
                <ThemedText type="subtitle" style={{ fontWeight: '700', fontSize: 18 }}>
                  Choose Banner Preset
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setIsCoverModalOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Close modal"
                style={styles.modalCloseBtn}>
                <MaterialCommunityIcons name="close" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 10 }}>
              Select a preset banner or upload custom image.
            </ThemedText>

            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              <View style={styles.presetGrid}>
                {COVER_PRESETS.map((preset) => {
                  const activeUri = !coverPhotoUri || coverPhotoUri === DEFAULT_COVER_KEY
                    ? DEFAULT_COVER_URI
                    : coverPhotoUri;
                  const isSelected = activeUri === preset.uri;
                  return (
                    <Pressable
                      key={preset.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.presetCard,
                        { borderColor: isSelected ? theme.accent : theme.border, backgroundColor: theme.cardMuted },
                        isSelected && { borderWidth: 2 },
                      ]}
                      onPress={() => {
                        if (coverPhotoUri !== profile.coverPhotoUri) {
                          void deleteLocalFile(coverPhotoUri);
                        }
                        setCoverPhotoUri(preset.uri);
                        setIsDirty(true);
                        triggerHaptic();
                        setIsCoverModalOpen(false);
                      }}
                    >
                      <Image source={getCoverSource(preset.uri)} style={styles.presetThumbnail} />
                      <View style={styles.presetMeta}>
                        <ThemedText type="smallBold" style={{ fontSize: 13 }}>{preset.name}</ThemedText>
                        <ThemedText type="caption" numberOfLines={1} style={{ color: theme.textSecondary, fontSize: 10.5 }}>
                          {preset.description}
                        </ThemedText>
                      </View>
                      {isSelected && (
                        <View style={[styles.selectedCheckBadge, { backgroundColor: theme.accentFill }]}>
                          <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={{ marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  setIsCoverModalOpen(false);
                  setTimeout(() => pickCoverPhoto(), 300);
                }}
                accessibilityRole="button"
                accessibilityLabel="Upload Custom Banner Photo"
                style={[styles.modalActionBtn, { backgroundColor: Brand.primary }]}
              >
                <MaterialCommunityIcons name="image-plus" size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={{ color: '#FFFFFF', fontSize: 13 }}>
                  Upload Custom Photo
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
  flex: { flex: 1 },
  outerContainer: { flex: 1 },
  content: { flexGrow: 1, paddingBottom: 100 },
  container: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  savedToast: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 999,
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  bannerCard: { overflow: 'hidden', paddingBottom: Spacing.two },
  coverContainer: { height: 120, width: '100%', position: 'relative' },
  coverImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  completionBarContainer: {
    position: 'absolute',
    top: 8,
    left: 10,
    gap: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.small,
  },
  completionRow: { flexDirection: 'row', alignItems: 'center' },
  completionText: { color: '#FFFFFF', fontSize: 9.5, fontWeight: '700' },
  completionTrack: { width: 70, height: 3, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  completionFill: { height: '100%', borderRadius: 2 },
  coverEditOverlay: {
    position: 'absolute',
    top: 8,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 3,
  },
  coverEditText: { color: '#FFFFFF', fontSize: 10.5, fontWeight: '600' },
  avatarRowContainer: {
    paddingHorizontal: Spacing.two,
    marginTop: -34,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatarWrapper: {
    position: 'relative',
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 32, resizeMode: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
  avatarCameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  profileInfoContainer: {
    paddingHorizontal: Spacing.two,
    marginTop: 6,
    gap: 2,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  displayNameText: { fontSize: 18, fontWeight: '800', lineHeight: 24 },
  bioText: { fontSize: 12, lineHeight: 16 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgePillText: { fontSize: 9.5, fontWeight: '700' },
  statsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.two,
    marginTop: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 1 },
  statNumber: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 9.5 },
  statDivider: { width: StyleSheet.hairlineWidth, height: '55%' },
  tabBarContainer: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
  },
  tabBarScrollContent: {
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 2,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.small,
  },
  tabButtonActive: {
    borderRadius: Radius.small,
  },
  tabSectionStack: { gap: Spacing.two },
  sectionCard: { gap: Spacing.two, padding: Spacing.two },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  field: { gap: 3 },
  rowFields: { flexDirection: 'row', gap: Spacing.two },
  input: {
    minHeight: 38,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    fontSize: 13,
  },
  multilineInput: { minHeight: 52, paddingTop: 6, paddingBottom: 6, textAlignVertical: 'top' },
  choiceGridHorizontal: { flexDirection: 'row', gap: 6 },
  choiceBtnCompact: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 5,
  },
  themeGridHorizontal: { flexDirection: 'row', gap: 6 },
  themeCardCompact: {
    flex: 1,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  settingRowItemCompact: {
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.two,
    paddingVertical: 6,
    gap: Spacing.two,
  },
  rowIconBadgeCompact: {
    width: 30,
    height: 30,
    borderRadius: Radius.small,
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
  segmentedBtnCompact: {
    paddingHorizontal: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Radius.small - 1,
  },
  switchRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  switchCopy: { flex: 1, gap: 1 },
  infoBannerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 2,
  },
  resetBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  footerNote: { textAlign: 'center', lineHeight: 16, paddingHorizontal: Spacing.two, marginTop: Spacing.one, fontSize: 10.5 },
  floatingActionBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    maxWidth: 680,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingActionCopy: { gap: 1 },
  floatingActionButtons: { flexDirection: 'row', gap: 6 },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
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
    maxWidth: 420,
    borderRadius: Radius.xlarge,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  modalCloseBtn: {
    padding: 4,
  },
  presetGrid: {
    gap: 8,
  },
  presetCard: {
    borderRadius: Radius.medium,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetThumbnail: {
    width: 72,
    height: 46,
    resizeMode: 'cover',
  },
  presetMeta: {
    flex: 1,
    paddingHorizontal: 10,
  },
  selectedCheckBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.medium,
    gap: 6,
  },
  pressed: { opacity: 0.75, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
});
