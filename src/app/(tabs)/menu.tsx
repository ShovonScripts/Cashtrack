import { useState } from 'react';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';

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
};

const FINANCIAL_MANAGEMENT: MenuItem[] = [
  {
    id: 'expenses',
    title: 'Transactions & Expenses',
    subtitle: 'Searchable log & category filters',
    icon: 'receipt',
    color: '#0152F5',
    route: '/(tabs)/expenses',
  },
  {
    id: 'income',
    title: 'Income Streams',
    subtitle: 'Recurring salary & cash sources',
    icon: 'wallet-plus-outline',
    color: '#7667F2',
    route: '/income',
  },
  {
    id: 'bills',
    title: 'Bills & Reminders',
    subtitle: 'Upcoming payment alerts & EMIs',
    icon: 'calendar-clock',
    color: '#EB5757',
    route: '/bills',
  },
  {
    id: 'debts',
    title: 'Debts & IOUs',
    subtitle: 'Track money lent and borrowed',
    icon: 'account-cash-outline',
    color: '#2D9CDB',
    route: '/debts',
  },
  {
    id: 'goals',
    title: 'Savings Goals & Pots',
    subtitle: 'Target milestone progress',
    icon: 'bullseye-arrow',
    color: '#27AE60',
    route: '/goals',
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
  },
  {
    id: 'reports',
    title: 'Analytics & Reports',
    subtitle: 'Monthly PDF & CSV data export',
    icon: 'chart-box-outline',
    color: '#159A8C',
    route: '/(tabs)/reports',
  },
  {
    id: 'categories',
    title: 'Categories Manager',
    subtitle: 'Create, rename, or recolor tags',
    icon: 'tag-multiple-outline',
    color: '#C17A24',
    route: '/categories',
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

export default function MenuScreen() {
  const theme = useTheme();
  const { profile, country } = useExpenses();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNavigate = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const query = searchQuery.trim().toLowerCase();

  const filterItems = (items: MenuItem[]) => {
    if (!query) return items;
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.subtitle.toLowerCase().includes(query)
    );
  };

  const filteredFinancial = filterItems(FINANCIAL_MANAGEMENT);
  const filteredIntelligence = filterItems(INTELLIGENCE_REPORTS);
  const filteredPreferences = filterItems(PREFERENCES_SYSTEM);

  const totalResults =
    filteredFinancial.length + filteredIntelligence.length + filteredPreferences.length;

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
                <MaterialCommunityIcons name={item.icon} size={19} color={item.color} />
              </View>
              <View style={styles.copy}>
                <View style={styles.rowTitleContainer}>
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.rowTitleText}>
                    {item.title}
                  </ThemedText>
                  {item.badge && (
                    <View style={[styles.badgeContainer, { backgroundColor: `${item.color}25` }]}>
                      <ThemedText type="caption" style={[styles.badgeText, { color: item.color }]}>
                        {item.badge}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {item.subtitle}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
        ))}
      </Card>
    );
  };

  const insets = useSafeAreaInsets();

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
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <ThemedText type="title">Menu Hub</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                All features & tools in one place
              </ThemedText>
            </View>
            <Pressable
              onPress={() => handleNavigate('/profile')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={[styles.headerIconButton, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <MaterialCommunityIcons name="cog-outline" size={20} color={theme.text} />
            </Pressable>
          </View>

          {/* User Hero Banner */}
          <Pressable
            onPress={() => handleNavigate('/profile')}
            style={({ pressed }) => [pressed && styles.rowPressed]}>
            <Card style={styles.userBanner}>
              <View style={[styles.userBadge, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name="account-outline" size={22} color={theme.accent} />
              </View>
              <View style={styles.userCopy}>
                <ThemedText type="defaultBold" numberOfLines={1}>
                  {profile.name.trim() ? profile.name.trim() : 'Personal Account'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {country.name} · {country.currencyCode} ({country.symbol.trim()})
                </ThemedText>
              </View>
              <View style={[styles.currencyPill, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="caption" style={styles.currencyPillText}>
                  {country.symbol.trim()}
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
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
    paddingBottom: 90,
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
    marginBottom: 2,
  },
  headerCopy: {
    gap: 1,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
  },
  userBadge: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCopy: {
    flex: 1,
    gap: 1,
  },
  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
  },
  currencyPillText: {
    fontWeight: '700',
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
  section: {
    gap: Spacing.one,
    marginTop: 2,
  },
  sectionHeader: {
    letterSpacing: 0.8,
    fontWeight: '700',
    fontSize: 10,
    paddingLeft: Spacing.one,
  },
  groupCard: {
    borderRadius: Radius.large,
  },
  row: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
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
    fontSize: 13,
  },
  badgeContainer: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 52,
  },
  rowPressed: {
    opacity: 0.7,
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
