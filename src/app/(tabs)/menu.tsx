import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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

  const handleNavigate = (route: string) => {
    triggerHaptic();
    router.push(route as any);
  };

  const renderSectionGroup = (items: MenuItem[]) => (
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
              <ThemedText type="smallBold" numberOfLines={1}>
                {item.title}
              </ThemedText>
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

  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top + Spacing.three, Spacing.five) }]} showsVerticalScrollIndicator={false}>
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
              style={[styles.headerIconButton, { backgroundColor: theme.card }]}>
              <MaterialCommunityIcons name="cog-outline" size={22} color={theme.text} />
            </Pressable>
          </View>

          {/* User Hero Banner */}
          <Pressable
            onPress={() => handleNavigate('/profile')}
            style={({ pressed }) => [pressed && styles.rowPressed]}>
            <Card style={styles.userBanner}>
              <View style={[styles.userBadge, { backgroundColor: theme.accentMuted }]}>
                <MaterialCommunityIcons name="account-outline" size={24} color={theme.accent} />
              </View>
              <View style={styles.userCopy}>
                <ThemedText type="defaultBold" numberOfLines={1}>
                  {profile.name.trim() ? profile.name.trim() : 'Personal Account'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                  {country.name} · {country.currencyCode} ({country.symbol.trim()})
                </ThemedText>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={theme.textSecondary} />
            </Card>
          </Pressable>

          {/* Section 1: Financial Management */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
              FINANCIAL MANAGEMENT
            </ThemedText>
            {renderSectionGroup(FINANCIAL_MANAGEMENT)}
          </View>

          {/* Section 2: Intelligence & Reports */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
              INTELLIGENCE & REPORTS
            </ThemedText>
            {renderSectionGroup(INTELLIGENCE_REPORTS)}
          </View>

          {/* Section 3: System & Preferences */}
          <View style={styles.section}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionHeader}>
              PREFERENCES & SYSTEM
            </ThemedText>
            {renderSectionGroup(PREFERENCES_SYSTEM)}
          </View>
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
    paddingVertical: Spacing.four,
    alignItems: 'center',
  },
  wrapper: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.half,
  },
  headerCopy: {
    gap: 2,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
  },
  userBadge: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userCopy: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: Spacing.one,
  },
  sectionHeader: {
    letterSpacing: 1,
    fontWeight: '700',
    fontSize: 11,
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
    paddingVertical: Spacing.two,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 56,
  },
  rowPressed: {
    opacity: 0.7,
  },
});
