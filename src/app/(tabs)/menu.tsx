import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  Image,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing, Brand } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import { useGoals } from '@/context/goal-context';
import { useDebts } from '@/context/debt-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

type MenuItem = {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
  badge?: string;
  badgeColor?: string;
};

export default function MenuScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const {
    profile,
    country,
    expenses,
    customCategories,
    toggleThemeMode,
    themeMode,
  } = useExpenses();
  const { goals } = useGoals();
  const { debts } = useDebts();
  const { reminders } = useFinancialReminders();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedFilterCategory] = useState<
    'all' | 'finances' | 'reports' | 'preferences'
  >('all');

  const handleNavigate = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  // Live Metric Badges
  const activeGoalsCount = goals.filter((g) => !g.isCompleted).length;
  const activeDebtsCount = debts.filter((d) => d.status === 'active').length;
  const activeReminders = reminders.filter(
    (r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped'
  );
  const overdueRemindersCount = activeReminders.filter(
    (r) => r.derivedStatus === 'overdue'
  ).length;

  const FINANCIAL_MANAGEMENT: MenuItem[] = [
    {
      id: 'expenses',
      title: 'Transactions & Expenses',
      subtitle: 'Searchable log & category filters',
      icon: 'receipt',
      color: '#0152F5',
      route: '/(tabs)/expenses',
      badge: `${expenses.length} logged`,
    },
    {
      id: 'income',
      title: 'Income Streams',
      subtitle: 'Recurring salary & cash sources',
      icon: 'wallet-plus-outline',
      color: '#7667F2',
      route: '/income',
      badge: 'Recurring',
    },
    {
      id: 'bills',
      title: 'Bills & Reminders',
      subtitle: 'Upcoming payment alerts & EMIs',
      icon: 'calendar-clock',
      color: overdueRemindersCount > 0 ? '#FF6B6B' : '#EB5757',
      route: '/bills',
      badge:
        overdueRemindersCount > 0
          ? `${overdueRemindersCount} overdue`
          : activeReminders.length > 0
            ? `${activeReminders.length} due`
            : undefined,
      badgeColor: overdueRemindersCount > 0 ? '#FF6B6B' : '#EB5757',
    },
    {
      id: 'debts',
      title: 'Debts & IOUs',
      subtitle: 'Track money lent and borrowed',
      icon: 'account-cash-outline',
      color: '#2D9CDB',
      route: '/debts',
      badge: activeDebtsCount > 0 ? `${activeDebtsCount} active` : undefined,
    },
    {
      id: 'goals',
      title: 'Savings Goals & Pots',
      subtitle: 'Target milestone progress',
      icon: 'bullseye-arrow',
      color: '#27AE60',
      route: '/goals',
      badge: activeGoalsCount > 0 ? `${activeGoalsCount} pots` : undefined,
    },
    {
      id: 'budgets',
      title: 'Budget Caps & Limits',
      subtitle: 'Category monthly spending limits',
      icon: 'scale-balance',
      color: '#BB6BD9',
      route: '/budgets',
    },
  ];

  const INTELLIGENCE_REPORTS: MenuItem[] = [
    {
      id: 'advisor',
      title: 'AI Financial Advisor',
      subtitle: 'Personalized budget check-in',
      icon: 'robot-outline',
      color: '#F2C94C',
      route: '/advisor',
      badge: 'AI',
      badgeColor: '#F2C94C',
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      subtitle: 'Monthly PDF & CSV data export',
      icon: 'chart-box-outline',
      color: '#159A8C',
      route: '/(tabs)/reports',
      badge: 'PDF / CSV',
    },
    {
      id: 'categories',
      title: 'Categories Manager',
      subtitle: 'Create, rename, or recolor tags',
      icon: 'tag-multiple-outline',
      color: '#C17A24',
      route: '/categories',
      badge: customCategories.length > 0 ? `${customCategories.length} custom` : undefined,
    },
  ];

  const PREFERENCES_SYSTEM: MenuItem[] = [
    {
      id: 'profile',
      title: 'Profile & Preferences',
      subtitle: 'Personal details, age & gender',
      icon: 'account-cog-outline',
      color: '#828282',
      route: '/profile',
    },
    {
      id: 'country',
      title: 'Country & Currency',
      subtitle: 'Region and currency settings',
      icon: 'earth',
      color: '#2D9CDB',
      route: '/country',
      badge: `${country.currencyCode} (${country.symbol.trim()})`,
    },
    {
      id: 'about',
      title: 'About CashTrack & Support',
      subtitle: 'Privacy promise & app version',
      icon: 'information-outline',
      color: '#5077C8',
      route: '/about',
    },
  ];

  const query = searchQuery.trim().toLowerCase();

  const filterItems = (items: MenuItem[]) => {
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  };

  const filteredFinancial =
    selectedCategory === 'all' || selectedCategory === 'finances'
      ? filterItems(FINANCIAL_MANAGEMENT)
      : [];
  const filteredIntelligence =
    selectedCategory === 'all' || selectedCategory === 'reports'
      ? filterItems(INTELLIGENCE_REPORTS)
      : [];
  const filteredPreferences =
    selectedCategory === 'all' || selectedCategory === 'preferences'
      ? filterItems(PREFERENCES_SYSTEM)
      : [];

  const totalResults =
    filteredFinancial.length +
    filteredIntelligence.length +
    filteredPreferences.length;

  const renderSectionGroup = (items: MenuItem[]) => {
    if (items.length === 0) return null;
    return (
      <Card padded={false} style={styles.groupCard}>
        {items.map((item, index) => (
          <View key={item.id}>
            {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
            <Pressable
              onPress={() => handleNavigate(item.route)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
              <View style={[styles.iconBadge, { backgroundColor: `${item.color}1E` }]}>
                <MaterialCommunityIcons name={item.icon} size={20} color={item.color} />
              </View>
              <View style={styles.copy}>
                <View style={styles.rowTitleContainer}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.rowTitleText}>
                    {item.title}
                  </ThemedText>
                  {item.badge && (
                    <View
                      style={[
                        styles.badgeContainer,
                        {
                          backgroundColor: `${item.badgeColor || item.color}20`,
                          borderColor: `${item.badgeColor || item.color}40`,
                        },
                      ]}>
                      <ThemedText
                        type="caption"
                        style={[styles.badgeText, { color: item.badgeColor || item.color }]}>
                        {item.badge}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {item.subtitle}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>
        ))}
      </Card>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four) },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.wrapper}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <ThemedText type="title">Menu Hub</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Command center & financial tools
              </ThemedText>
            </View>

            {/* Quick Theme Switcher Button */}
            <Pressable
              onPress={() => {
                triggerHaptic();
                toggleThemeMode();
              }}
              accessibilityRole="button"
              accessibilityLabel="Toggle theme mode"
              style={({ pressed }) => [
                styles.themeIconButton,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && styles.rowPressed,
              ]}>
              <MaterialCommunityIcons
                name={themeMode === 'dark' ? 'weather-sunny' : 'weather-night'}
                size={20}
                color={themeMode === 'dark' ? '#F59E0B' : theme.text}
              />
            </Pressable>
          </View>

          {/* User Masterclass Profile Hero Banner */}
          <Pressable
            onPress={() => handleNavigate('/profile')}
            style={({ pressed }) => [pressed && styles.rowPressed]}>
            <Card style={styles.userBannerCard}>
              <View style={[styles.bannerAccentLine, { backgroundColor: Brand.primary }]} />

              <View style={styles.userBannerRow}>
                {/* User Avatar Image or Initial Badge */}
                <View style={[styles.avatarWrapper, { borderColor: theme.accent }]}>
                  {profile.profilePhotoUri ? (
                    <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                      <ThemedText type="defaultBold" style={styles.avatarInitial}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.badgeIconOverlay, { backgroundColor: theme.accent }]}>
                    <MaterialCommunityIcons name="shield-check" size={10} color="#FFFFFF" />
                  </View>
                </View>

                {/* Account Details Copy */}
                <View style={styles.userCopy}>
                  <View style={styles.userNameRow}>
                    <ThemedText type="defaultBold" numberOfLines={1} style={styles.accountNameText}>
                      {profile.name.trim() ? profile.name.trim() : 'Personal Account'}
                    </ThemedText>
                    <View style={[styles.privateTagPill, { backgroundColor: theme.accentMuted }]}>
                      <ThemedText type="caption" style={[styles.privateTagText, { color: theme.accent }]}>
                        Private
                      </ThemedText>
                    </View>
                  </View>

                  <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                    {country.name} · {country.currencyCode} ({country.symbol.trim()})
                  </ThemedText>
                </View>

                {/* Country Currency Symbol Pill */}
                <View style={[styles.currencyPill, { backgroundColor: theme.backgroundElement }]}>
                  <ThemedText type="caption" style={styles.currencyPillText}>
                    {country.symbol.trim()}
                  </ThemedText>
                </View>

                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
              </View>
            </Card>
          </Pressable>

          {/* Search Bar */}
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}>
            <MaterialCommunityIcons name="magnify" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search features, tools, budgets..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setSearchQuery('');
                }}
                hitSlop={8}>
                <MaterialCommunityIcons name="close-circle" size={16} color={theme.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Filter Chips Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}>
            {(
              [
                { key: 'all', label: 'All Tools' },
                { key: 'finances', label: 'Finances' },
                { key: 'reports', label: 'AI & Analytics' },
                { key: 'preferences', label: 'System & Preferences' },
              ] as const
            ).map((chip) => {
              const active = selectedCategory === chip.key;
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedFilterCategory(chip.key);
                  }}
                  style={({ pressed }) => [
                    styles.chipBtn,
                    {
                      backgroundColor: active ? theme.accent : theme.cardMuted,
                      borderColor: active ? theme.accent : theme.border,
                    },
                    pressed && styles.rowPressed,
                  ]}>
                  <ThemedText
                    type="caption"
                    style={{
                      color: active ? '#FFFFFF' : theme.textSecondary,
                      fontWeight: active ? '700' : '600',
                    }}>
                    {chip.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>

          {totalResults === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="file-search-outline" size={32} color={theme.textSecondary} />
              <ThemedText type="defaultBold" style={styles.emptyTitle}>
                No matching tools found
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.emptySubtitle}>
                Try searching for &apos;expenses&apos;, &apos;bills&apos;, &apos;budget&apos;, or &apos;AI&apos;
              </ThemedText>
            </Card>
          ) : (
            <>
              {/* Section 1: Financial Management */}
              {filteredFinancial.length > 0 && (
                <View style={styles.section}>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
                    FINANCIAL MANAGEMENT
                  </ThemedText>
                  {renderSectionGroup(filteredFinancial)}
                </View>
              )}

              {/* Section 2: Intelligence & Reports */}
              {filteredIntelligence.length > 0 && (
                <View style={styles.section}>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
                    INTELLIGENCE & REPORTS
                  </ThemedText>
                  {renderSectionGroup(filteredIntelligence)}
                </View>
              )}

              {/* Section 3: System & Preferences */}
              {filteredPreferences.length > 0 && (
                <View style={styles.section}>
                  <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
                    PREFERENCES & SYSTEM
                  </ThemedText>
                  {renderSectionGroup(filteredPreferences)}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: Spacing.three,
    alignItems: 'center',
    paddingBottom: 110,
  },
  wrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerCopy: {
    gap: 1,
  },
  themeIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBannerCard: {
    padding: 0,
    overflow: 'hidden',
  },
  bannerAccentLine: {
    height: 3,
    width: '100%',
  },
  userBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  badgeIconOverlay: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 14,
    height: 14,
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userCopy: {
    flex: 1,
    gap: 2,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  accountNameText: {
    fontSize: 15,
  },
  privateTagPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  privateTagText: {
    fontSize: 9,
    fontWeight: '800',
  },
  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  currencyPillText: {
    fontWeight: '800',
    fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filterScroll: {
    gap: Spacing.one,
    paddingVertical: 2,
  },
  chipBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: {
    gap: Spacing.one,
    marginTop: 4,
  },
  sectionHeader: {
    letterSpacing: 0.8,
    fontWeight: '800',
    fontSize: 10,
    paddingLeft: Spacing.one,
  },
  groupCard: {
    borderRadius: Radius.large,
  },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  rowTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitleText: {
    flexShrink: 1,
    fontSize: 13.5,
  },
  badgeContainer: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  rowPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
  },
  emptyTitle: {
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
