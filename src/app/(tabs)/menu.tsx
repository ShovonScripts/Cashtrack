import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Badge, Chip, Icon, ListRow, Screen, ScreenHeader, SearchField, Section } from '@/components/ui';
import type { BadgeTone } from '@/components/ui/badge';
import type { GlyphName, IconConcept } from '@/constants/icons';
import { BadgeSize, FeatureColors, PressFeedback, Radius, Spacing } from '@/constants/theme';
import { useDebts } from '@/context/debt-context';
import { usePreferences } from '@/context/expense-context';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useGoals } from '@/context/goal-context';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

type GroupKey = 'money' | 'insights' | 'tools' | 'settings';
type Filter = 'all' | GroupKey;

type MenuItem = {
  id: string;
  /** Same words as the page's own header, so people know where they landed. */
  title: string;
  subtitle: string;
  icon: IconConcept | GlyphName;
  /** Each row has its own hue so neighbours never look alike. */
  color: string;
  route: Href;
  /** Live status only (counts, overdue). Never a fixed label. */
  badge?: string;
  badgeTone?: BadgeTone;
  /** Extra words people might search for that are not in the title or subtitle. */
  keywords?: string;
};

const GROUPS: { key: GroupKey; title: string }[] = [
  { key: 'money', title: 'Money' },
  { key: 'insights', title: 'Insights' },
  { key: 'tools', title: 'Tools' },
  { key: 'settings', title: 'Settings' },
];

const FILTERS: { key: Filter; label: string }[] = [{ key: 'all', label: 'All' }, ...GROUPS.map((g) => ({ key: g.key, label: g.title }))];

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default function MenuScreen() {
  const { profile, country, customCategories } = usePreferences();
  const { goals } = useGoals();
  const { debts } = useDebts();
  const { reminders } = useFinancialReminders();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const activePots = goals.filter((g) => !g.isCompleted).length;
  const activeDebts = debts.filter((d) => d.status === 'active').length;
  const openBills = reminders.filter((r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped');
  const overdueBills = openBills.filter((r) => r.derivedStatus === 'overdue').length;
  const currency = `${country.currencyCode} ${country.symbol.trim()}`;

  const items: Record<GroupKey, MenuItem[]> = {
    money: [
      {
        id: 'income',
        title: 'Money In',
        subtitle: 'Salary and other income',
        icon: 'income',
        color: FeatureColors.violet,
        route: '/income',
        keywords: 'income salary wage earnings recurring',
      },
      {
        id: 'bills',
        title: 'Bills & Reminders',
        subtitle: 'Upcoming payments and EMIs',
        icon: 'bill',
        color: FeatureColors.coral,
        route: '/bills',
        badge: overdueBills > 0 ? `${overdueBills} overdue` : openBills.length > 0 ? `${openBills.length} due` : undefined,
        badgeTone: overdueBills > 0 ? 'danger' : 'warning',
        keywords: 'bill reminder emi rent payment due history',
      },
      {
        id: 'calendar',
        title: 'Bills Calendar',
        subtitle: 'Bills and renewals by date',
        icon: 'calendar',
        color: FeatureColors.indigo,
        route: '/bills/calendar',
        keywords: 'calendar schedule renewal subscription month',
      },
      {
        id: 'debts',
        title: 'Lend & Borrow',
        subtitle: 'Money you lent and borrowed',
        icon: 'debt',
        color: FeatureColors.azure,
        route: '/debts',
        badge: activeDebts > 0 ? `${activeDebts} active` : undefined,
        keywords: 'debt iou loan lend borrow owe',
      },
      {
        id: 'goals',
        title: 'Money Plan & Pots',
        subtitle: 'Savings goals and progress',
        icon: 'pot',
        color: FeatureColors.leaf,
        route: '/goals',
        badge: activePots > 0 ? plural(activePots, 'pot', 'pots') : undefined,
        badgeTone: 'accent',
        keywords: 'goal pot savings save target',
      },
      {
        id: 'budgets',
        title: 'Category Limits',
        subtitle: 'Monthly spending caps',
        icon: 'budget',
        color: FeatureColors.orchid,
        route: '/budgets',
        keywords: 'budget cap limit',
      },
    ],
    insights: [
      {
        id: 'advisor',
        title: 'Spending Advisor',
        subtitle: 'A personal budget check-in',
        icon: 'lightbulb-on-outline',
        color: FeatureColors.gold,
        route: '/advisor',
        keywords: 'advice tips smart insight',
      },
      {
        id: 'reports',
        title: 'Insights',
        subtitle: 'Charts, reports and PDF or CSV export',
        icon: 'report',
        color: FeatureColors.teal,
        route: '/(tabs)/reports',
        keywords: 'analytics report chart pdf csv export daily weekly monthly yearly',
      },
      {
        id: 'categories',
        title: 'Manage Categories',
        subtitle: 'Create, rename or recolour categories',
        icon: 'tag-multiple-outline',
        color: FeatureColors.bronze,
        route: '/categories',
        badge: customCategories.length > 0 ? `${customCategories.length} custom` : undefined,
        keywords: 'category tag colour color',
      },
    ],
    tools: [
      {
        id: 'calculator',
        title: 'Calculator',
        subtitle: 'Maths, tips and bill splits',
        icon: 'calculator-variant-outline',
        color: FeatureColors.blue,
        route: '/calculator',
        keywords: 'math tip split',
      },
      {
        id: 'currency',
        title: 'Currency Converter',
        subtitle: 'Convert between currencies',
        icon: 'swap-horizontal-circle-outline',
        color: FeatureColors.emerald,
        route: '/currency',
        keywords: 'exchange rate money convert',
      },
      {
        id: 'notes',
        title: 'Notes',
        subtitle: 'Quick notes on your device',
        icon: 'note-text-outline',
        color: FeatureColors.orange,
        route: '/notes',
        keywords: 'note memo write',
      },
      {
        id: 'todo',
        title: 'To-Do List',
        subtitle: 'Checklist and money reminders',
        icon: 'checkbox-marked-circle-outline',
        color: FeatureColors.crimson,
        route: '/todo',
        keywords: 'todo task checklist',
      },
      {
        id: 'stopwatch',
        title: 'Stopwatch & Timer',
        subtitle: 'Laps, and timers that ring your phone',
        icon: 'timer-outline',
        color: FeatureColors.amber,
        route: '/stopwatch',
        keywords: 'alarm timer countdown lap',
      },
      {
        id: 'world-clock',
        title: 'World Clocks',
        subtitle: 'City times and time differences',
        icon: 'earth',
        color: FeatureColors.sky,
        route: '/world-clock',
        keywords: 'time zone city clock',
      },
    ],
    settings: [
      {
        id: 'profile',
        title: 'Profile & Settings',
        subtitle: 'Theme, privacy, alerts and backup',
        icon: 'account-cog-outline',
        color: FeatureColors.gray,
        route: '/profile',
        keywords: 'name photo theme dark mode app lock security notification backup restore export reset',
      },
      {
        id: 'country',
        title: 'Country & Currency',
        subtitle: 'Region and money format',
        icon: 'map-marker-outline',
        color: FeatureColors.green,
        route: '/country',
        badge: currency,
        keywords: 'region currency symbol format',
      },
      {
        id: 'manual',
        title: 'User Manual',
        subtitle: 'How every feature works',
        icon: 'book-open-page-variant-outline',
        color: FeatureColors.cyan,
        route: '/user-manual',
        keywords: 'help guide faq',
      },
      ...(__DEV__
        ? [
            {
              id: 'style-guide',
              title: 'Style Guide',
              subtitle: 'Development builds only',
              icon: 'palette-outline' as const,
              color: FeatureColors.mint,
              route: '/dev/style-guide' as Href,
            },
          ]
        : []),
      {
        id: 'about',
        title: 'About CashTrack',
        subtitle: 'Privacy promise, support and version',
        icon: 'info',
        color: FeatureColors.slate,
        route: '/about',
        keywords: 'privacy policy donate tip support version',
      },
    ],
  };

  const query = search.trim().toLowerCase();
  const matches = (item: MenuItem) =>
    !query || `${item.title} ${item.subtitle} ${item.keywords ?? ''}`.toLowerCase().includes(query);

  const visibleGroups = GROUPS.filter((g) => filter === 'all' || filter === g.key)
    .map((g) => ({ ...g, rows: items[g.key].filter(matches) }))
    .filter((g) => g.rows.length > 0);
  const resultCount = visibleGroups.reduce((sum, g) => sum + g.rows.length, 0);

  const open = (route: Href) => {
    triggerHaptic();
    router.push(route);
  };

  const resetSearch = () => {
    setSearch('');
    setFilter('all');
  };

  return (
    <Screen tabInset>
      <ScreenHeader title="More" subtitle="Money, tools and settings" />

      <ProfileCard
        name={profile.name.trim()}
        photoUri={profile.profilePhotoUri}
        place={country.name}
        onPress={() => open('/profile')}
      />

      <View style={styles.searchBlock}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search bills, goals, tools…" label="Search More" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {FILTERS.map((f) => (
            <Chip
              key={f.key}
              label={f.label}
              selected={filter === f.key}
              onPress={() => {
                triggerHaptic();
                setFilter(f.key);
              }}
            />
          ))}
        </ScrollView>
        {query ? (
          <ThemedText type="caption" themeColor="textSecondary" accessibilityLiveRegion="polite">
            {plural(resultCount, 'result', 'results')}
          </ThemedText>
        ) : null}
      </View>

      {resultCount === 0 ? (
        <Card>
          <EmptyState
            title="Nothing matches"
            message={`No page matches “${search.trim()}”. Try “bills”, “goals”, “backup” or “calculator”.`}
            icon="file-search-outline"
            actionLabel="Clear search"
            onAction={resetSearch}
          />
        </Card>
      ) : (
        visibleGroups.map((group) => (
          <Section key={group.key} title={group.title}>
            <Card padded={false}>
              {group.rows.map((item, index) => (
                <View key={item.id}>
                  {index > 0 ? <CardDivider /> : null}
                  <ListRow
                    title={item.title}
                    subtitle={item.subtitle}
                    icon={item.icon}
                    color={item.color}
                    badge={item.badge}
                    badgeTone={item.badgeTone}
                    onPress={() => open(item.route)}
                  />
                </View>
              ))}
            </Card>
          </Section>
        ))
      )}
    </Screen>
  );
}

type ProfileCardProps = {
  name: string;
  photoUri?: string;
  place: string;
  onPress: () => void;
};

/** The person this app belongs to, at the top of More. Opens Profile & Settings. */
function ProfileCard({ name, photoUri, place, onPress }: ProfileCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${name || 'Your profile'}, ${place}`}
      accessibilityHint="Opens Profile & Settings"
      style={({ pressed }) => pressed && PressFeedback}>
      <Card style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: theme.accentFill }]}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.avatarImage} accessibilityIgnoresInvertColors />
          ) : name ? (
            <ThemedText type="subtitle" style={{ color: theme.onBrand }}>
              {name.charAt(0).toUpperCase()}
            </ThemedText>
          ) : (
            <Icon name="account-outline" size="lg" color={theme.onBrand} />
          )}
        </View>

        <View style={styles.profileCopy}>
          <ThemedText type="defaultBold" numberOfLines={1}>
            {name || 'Your profile'}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            {name ? place : 'Add your name and photo'}
          </ThemedText>
          <Badge label="Private · on this device" tone="accent" icon="shield-check-outline" />
        </View>

        <Icon name="next" size="md" color={theme.textSecondary} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBlock: { gap: Spacing.two },
  filters: { gap: Spacing.two, paddingVertical: Spacing.half },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  avatar: {
    width: BadgeSize.lg,
    height: BadgeSize.lg,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: '100%', height: '100%' },
  profileCopy: { flex: 1, gap: Spacing.half },
});
