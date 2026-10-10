import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useFinancialReminders } from '@/context/financial-reminders-context';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { triggerHaptic } from '@/utils/motion';

function getCategoryIcon(category: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Subscription':
      return 'repeat';
    case 'Utilities':
    case 'Bills':
      return 'flash';
    case 'Rent':
      return 'home';
    case 'EMI':
    case 'Loan':
      return 'bank';
    case 'Insurance':
      return 'shield-check';
    default:
      return 'calendar-clock';
  }
}

export default function SubscriptionsHubScreen() {
  const theme = useTheme();
  const { reminders } = useFinancialReminders();
  const { formatAmount } = useExpenses();

  // Filter for recurring bills or subscriptions
  const recurringReminders = reminders.filter(
    (r) => r.repeatType !== 'one-time' || r.category === 'Subscription'
  );

  const activeRecurring = recurringReminders.filter(
    (r) => r.derivedStatus !== 'paid' && r.derivedStatus !== 'skipped'
  );

  const totalMonthlyOutflow = activeRecurring.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Hero Banner */}
        <View style={[styles.hero, { backgroundColor: Brand.deep }]}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>RECURRING & SUBSCRIPTIONS</ThemedText>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
                accessibilityRole="button"
                accessibilityLabel="Add subscription or recurring bill"
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
                <ThemedText type="defaultBold" style={styles.addButtonText}>＋ Add recurring</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>MONTHLY OUTFLOW</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(totalMonthlyOutflow)}
                </ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>ACTIVE RENEWALS</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {activeRecurring.length}
                </ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </View>

        {/* Subscriptions & Recurring List */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <ThemedText type="defaultBold">Active renewals & subscriptions</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">{activeRecurring.length} items</ThemedText>
          </View>

          {activeRecurring.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No recurring subscriptions"
                message="Track Netflix, Spotify, gym memberships, and rent reminders in one place."
                tone={theme.accent}
              />
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
                style={[styles.emptyActionBtn, { backgroundColor: theme.accent }]}>
                <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>Add subscription</ThemedText>
              </Pressable>
            </Card>
          ) : (
            <Card padded={false}>
              {activeRecurring.map((rem, index) => {
                const isOverdue = rem.derivedStatus === 'overdue';
                const isDueToday = rem.derivedStatus === 'due_today';
                const color = isOverdue ? theme.danger : isDueToday ? '#BD7119' : theme.accent;
                const statusText = isOverdue
                  ? `${Math.abs(rem.daysUntilDue)}d overdue`
                  : isDueToday
                    ? 'Due today'
                    : `Renews in ${rem.daysUntilDue}d`;
                const iconName = getCategoryIcon(rem.category);

                return (
                  <View key={rem.id}>
                    {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
                    <Pressable
                      onPress={() => {
                        triggerHaptic();
                        router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Manage ${rem.title}`}
                      style={({ pressed }) => [styles.rowItem, pressed && styles.pressed]}>
                      <View style={[styles.iconBadge, { backgroundColor: `${color}1E` }]}>
                        <MaterialCommunityIcons name={iconName} size={20} color={color} />
                      </View>
                      <View style={styles.rowCopy}>
                        <ThemedText type="smallBold" numberOfLines={1}>{rem.title}</ThemedText>
                        <ThemedText type="caption" style={{ color }}>
                          {statusText} · {rem.category} ({rem.repeatType})
                        </ThemedText>
                      </View>
                      <View style={styles.rowRight}>
                        <ThemedText type="smallBold" style={{ color }}>
                          {rem.amount !== null ? formatAmount(rem.amount) : 'Variable'}
                        </ThemedText>
                        <MaterialCommunityIcons name="chevron-right" size={18} color={theme.textSecondary} />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: Spacing.five },
  container: { width: '100%', maxWidth: 720, alignSelf: 'center', padding: Spacing.four, gap: Spacing.three },
  hero: {
    backgroundColor: Brand.deep,
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    overflow: 'hidden',
    minHeight: 180,
    justifyContent: 'center',
  },
  heroContent: { gap: Spacing.two, zIndex: 1 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.72)', letterSpacing: 1 },
  addButton: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  addButtonText: { color: Brand.deep },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginVertical: Spacing.half },
  heroStat: { flex: 1, gap: Spacing.half },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatVal: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroOrbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -90, top: -100, backgroundColor: 'rgba(139,123,255,0.2)' },
  heroOrbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: 14, bottom: -90, backgroundColor: 'rgba(176,76,252,0.2)' },
  listSection: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emptyCard: { padding: Spacing.four, alignItems: 'center', gap: Spacing.three },
  emptyActionBtn: { minHeight: 44, paddingHorizontal: Spacing.four, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  iconBadge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  rowCopy: { flex: 1, gap: 2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  divider: { height: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.75 },
});
