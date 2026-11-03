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
import { Brand, FeatureColors, MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { Chip, ListRow, Section } from '@/components/ui';
import { useTheme } from '@/hooks/use-theme';
import { usePreferences } from '@/context/expense-context';
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
  const { profile, country, customCategories, showExtras } = usePreferences();
  const { goals } = useGoals();
  const { debts } = useDebts();
  const { reminders } = useFinancialReminders();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedFilterCategory] = useState<
    'all' | 'finances' | 'reports' | 'preferences' | 'tools'
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

  const EXTRA_TOOLS: MenuItem[] = [
    {
      id: 'world-clock',
      title: 'World Clocks',
      subtitle: 'World times and timezones',
      icon: 'earth',
      color: FeatureColors.sky,
      route: '/world-clock',
    },
    {
      id: 'stopwatch',
      title: 'Stopwatch & Timer',
      subtitle: 'Time yourself and track durations',
      icon: 'timer-outline',
      color: FeatureColors.amber,
      route: '/stopwatch',
    },
  ];

  const UTILITY_TOOLS: MenuItem[] = [
    {
      id: 'calculator',
      title: 'Calculator',
      subtitle: 'Math, tips and bill splits',
      icon: 'calculator-variant-outline',
      color: FeatureColors.blue,
      route: '/calculator',
    },
    {
      id: 'currency',
      title: 'Currency Converter',
      subtitle: 'Convert between currencies',
      icon: 'currency-usd',
      color: FeatureColors.emerald,
      route: '/currency',
    },
    {
      id: 'notes',
      title: 'Notes',
      subtitle: 'Quick notes on your device',
      icon: 'note-text-outline',
      color: FeatureColors.green,
      route: '/notes',
    },
    {
      id: 'todo',
      title: 'To-Do List',
      subtitle: 'Checklist and money reminders',
      icon: 'check-circle-outline',
      color: FeatureColors.emerald,
      route: '/todo',
    },
  ];

  const FINANCIAL_MANAGEMENT: MenuItem[] = [
    {
      id: 'income',
      title: 'Income Streams',
      subtitle: 'Recurring salary & cash sources',
      icon: 'wallet-plus-outline',
      color: FeatureColors.violet,
      route: '/income',
      badge: 'Recurring',
    },
    {
      id: 'bills',
      title: 'Bills & Reminders',
      subtitle: 'Upcoming payment alerts & EMIs',
      icon: 'calendar-clock',
      color: overdueRemindersCount > 0 ? FeatureColors.coral : FeatureColors.red,
      route: '/bills',
      badge:
        overdueRemindersCount > 0
          ? `${overdueRemindersCount} overdue`
          : activeReminders.length > 0
            ? `${activeReminders.length} due`
            : undefined,
      badgeColor: overdueRemindersCount > 0 ? FeatureColors.coral : FeatureColors.red,
    },
    {
      id: 'calendar',
      title: 'Bill & Renewal Calendar',
      subtitle: 'Interactive monthly schedule grid',
      icon: 'calendar-month',
      color: FeatureColors.indigo,
      route: '/bills/calendar',
      badge: 'Calendar',
    },
    {
      id: 'debts',
      title: 'Debts & IOUs',
      subtitle: 'Track money lent and borrowed',
      icon: 'account-cash-outline',
      color: FeatureColors.azure,
      route: '/debts',
      badge: activeDebtsCount > 0 ? `${activeDebtsCount} active` : undefined,
    },
    {
      id: 'goals',
      title: 'Savings Goals & Pots',
      subtitle: 'Target milestone progress',
      icon: 'bullseye-arrow',
      color: FeatureColors.leaf,
      route: '/goals',
      badge: activeGoalsCount > 0 ? `${activeGoalsCount} pots` : undefined,
    },
    {
      id: 'budgets',
      title: 'Budget Caps & Limits',
      subtitle: 'Category monthly spending limits',
      icon: 'scale-balance',
      color: FeatureColors.orchid,
      route: '/budgets',
    },
  ];

  const INTELLIGENCE_REPORTS: MenuItem[] = [
    {
      id: 'advisor',
      title: 'Spending Advisor',
      subtitle: 'Personalized budget check-in',
      icon: 'lightbulb-on-outline',
      color: FeatureColors.gold,
      route: '/advisor',
      badge: 'SMART',
      badgeColor: FeatureColors.gold,
    },
    {
      id: 'reports',
      title: 'Analytics & Reports',
      subtitle: 'Monthly PDF & CSV data export',
      icon: 'chart-box-outline',
      color: FeatureColors.teal,
      route: '/(tabs)/reports',
      badge: 'PDF / CSV',
    },
    {
      id: 'categories',
      title: 'Categories Manager',
      subtitle: 'Create, rename, or recolor tags',
      icon: 'tag-multiple-outline',
      color: FeatureColors.bronze,
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
      color: FeatureColors.gray,
      route: '/profile',
    },
    {
      id: 'country',
      title: 'Country & Currency',
      subtitle: 'Region and currency settings',
      icon: 'earth',
      color: FeatureColors.azure,
      route: '/country',
      badge: `${country.currencyCode} (${country.symbol.trim()})`,
    },
    {
      id: 'manual',
      title: 'User Manual & Help',
      subtitle: 'Searchable guide to every feature',
      icon: 'book-open-page-variant-outline',
      color: FeatureColors.cyan,
      route: '/user-manual',
      badge: 'Guide',
    },
    {
      id: 'about',
      title: 'About CashTrack & Support',
      subtitle: 'Privacy promise & app version',
      icon: 'information-outline',
      color: FeatureColors.slate,
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

  const filteredTools =
    selectedCategory === 'all' || selectedCategory === 'tools'
      ? filterItems(showExtras ? [...UTILITY_TOOLS, ...EXTRA_TOOLS] : UTILITY_TOOLS)
      : [];
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
    filteredTools.length +
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
            <ListRow
              title={item.title}
              subtitle={item.subtitle}
              icon={item.icon}
              color={item.color}
              badge={item.badge}
              badgeColor={item.badgeColor}
              onPress={() => handleNavigate(item.route)}
            />
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
              <ThemedText type="title">More</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                Money, tools and settings
              </ThemedText>
            </View>
          </View>

          {/* User Masterclass Profile Hero Banner */}
          <Pressable
            onPress={() => handleNavigate('/profile')}
            accessibilityRole="button"
            accessibilityLabel={`Profile settings for ${profile.name || 'Personal Account'}`}
            style={({ pressed }) => [pressed && styles.rowPressed]}>
            <Card style={styles.userBannerCard}>
              <View style={[styles.bannerAccentLine, { backgroundColor: Brand.primary }]} />

              <View style={styles.userBannerRow}>
                {/* User Avatar Image or Initial Badge */}
                <View style={[styles.avatarWrapper, { borderColor: theme.accent }]}>
                  {profile.profilePhotoUri ? (
                    <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} />
                  ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accentFill }]}>
                      <ThemedText type="defaultBold" style={styles.avatarInitial}>
                        {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                      </ThemedText>
                    </View>
                  )}
                  <View style={[styles.badgeIconOverlay, { backgroundColor: theme.accentFill }]}>
                    <MaterialCommunityIcons name="shield-check" size={10} color={Palette.white} />
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
              placeholder="Search bills, goals, tools..."
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              accessibilityLabel="Search features, tools, budgets"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  setSearchQuery('');
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search query"
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
                { key: 'all', label: 'All' },
                { key: 'finances', label: 'Money' },
                { key: 'reports', label: 'Insights' },
                { key: 'tools', label: 'Tools' },
                { key: 'preferences', label: 'Settings' },
              ] as const
            ).map((chip) => (
              <Chip
                key={chip.key}
                label={chip.label}
                selected={selectedCategory === chip.key}
                onPress={() => {
                  triggerHaptic();
                  setSelectedFilterCategory(chip.key);
                }}
              />
            ))}
          </ScrollView>

          {totalResults === 0 ? (
            <Card style={styles.emptyCard}>
              <MaterialCommunityIcons name="file-search-outline" size={32} color={theme.textSecondary} />
              <ThemedText type="defaultBold" style={styles.emptyTitle}>
                Nothing matches your search
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.emptySubtitle}>
                Try &apos;bills&apos;, &apos;goals&apos;, &apos;calculator&apos; or &apos;budget&apos;
              </ThemedText>
            </Card>
          ) : (
            <>
              {/* Section 1: Financial Management */}
              {filteredFinancial.length > 0 && (
                <Section title="Money">
                    {renderSectionGroup(filteredFinancial)}
                  </Section>
              )}

              {/* Section 2: Intelligence & Reports */}
              {filteredIntelligence.length > 0 && (
                <Section title="Insights">
                    {renderSectionGroup(filteredIntelligence)}
                  </Section>
              )}

              {/* Section: Utility Tools */}
              {filteredTools.length > 0 && (
                <Section title="Tools">
                    {renderSectionGroup(filteredTools)}
                  </Section>
              )}

              {/* Section 3: System & Preferences */}
              {filteredPreferences.length > 0 && (
                <Section title="Settings">
                    {renderSectionGroup(filteredPreferences)}
                  </Section>
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
    color: Palette.white,
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
    minHeight: 42,
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
  groupCard: {
    borderRadius: Radius.large,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginStart: 56,
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
