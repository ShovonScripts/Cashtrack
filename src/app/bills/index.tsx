import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { useExpenses } from '@/context/expense-context';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import { confirmDelete } from '@/utils/confirm';

type FilterTab = 'all' | 'due_today' | 'overdue' | 'upcoming' | 'paid';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

function getReminderCategoryIcon(category: string): keyof typeof MaterialCommunityIcons.glyphMap {
  switch (category) {
    case 'Bills':
    case 'Utilities':
      return 'flash';
    case 'Rent':
      return 'home';
    case 'EMI':
    case 'Loan':
      return 'bank';
    case 'Credit Card':
      return 'credit-card';
    case 'Subscription':
      return 'repeat';
    case 'Insurance':
      return 'shield-check';
    default:
      return 'calendar-clock';
  }
}

export default function BillsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { reminders } = useFinancialReminders();
  const { formatAmount } = useExpenses();
  const [tab, setTab] = useState<FilterTab>('all');

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dueTodayCount = reminders.filter((r) => r.derivedStatus === 'due_today').length;
  const overdueCount = reminders.filter((r) => r.derivedStatus === 'overdue').length;
  const upcomingCount = reminders.filter((r) => r.derivedStatus === 'upcoming').length;
  const paidCount = reminders.filter((r) => r.derivedStatus === 'paid').length;

  const monthDueTotal = reminders
    .filter((r) => {
      const d = new Date(r.dueDate);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && r.derivedStatus !== 'paid';
    })
    .reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const filteredReminders = reminders.filter((r) => {
    if (tab === 'due_today') return r.derivedStatus === 'due_today';
    if (tab === 'overdue') return r.derivedStatus === 'overdue';
    if (tab === 'upcoming') return r.derivedStatus === 'upcoming';
    if (tab === 'paid') return r.derivedStatus === 'paid';
    return true; // 'all'
  });

  const tabs: { label: string; value: FilterTab; count: number; color?: string }[] = [
    { label: 'All', value: 'all', count: reminders.length },
    { label: 'Due Today', value: 'due_today', count: dueTodayCount, color: '#F59E0B' },
    { label: 'Overdue', value: 'overdue', count: overdueCount, color: '#FF6B6B' },
    { label: 'Upcoming', value: 'upcoming', count: upcomingCount, color: theme.accent },
    { label: 'Paid', value: 'paid', count: paidCount, color: '#10B981' },
  ];

  const safeFormatAmount = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top, Spacing.three) }]}
      showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Spendly Brand Multi-Tone Glass Hero Card */}
        <View style={styles.heroGlassCard}>
          <View pointerEvents="none" style={styles.primaryBlueOrb} />
          <View pointerEvents="none" style={styles.brightCyanOrb} />

          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>
                DUE THIS MONTH
              </ThemedText>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
                accessibilityRole="button"
                accessibilityLabel="Add bill or reminder"
                style={({ pressed }) => [styles.glassAddBtn, pressed && styles.pressed]}>
                <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
                <ThemedText type="smallBold" style={styles.quickAddText}>
                  Add Bill
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>
                  TOTAL DUE
                </ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(monthDueTotal)}
                </ThemedText>
              </View>

              <View style={styles.heroDivider} />

              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>
                  ACTION NEEDED
                </ThemedText>
                <View style={styles.actionPillRow}>
                  {overdueCount > 0 ? (
                    <View style={styles.overdueGlassPill}>
                      <MaterialCommunityIcons name="alert-circle" size={12} color="#F87171" />
                      <ThemedText type="caption" style={{ color: '#F87171', fontWeight: '800' }}>
                        {overdueCount} Overdue
                      </ThemedText>
                    </View>
                  ) : dueTodayCount > 0 ? (
                    <View style={styles.dueTodayGlassPill}>
                      <MaterialCommunityIcons name="clock-alert" size={12} color="#FBBF24" />
                      <ThemedText type="caption" style={{ color: '#FBBF24', fontWeight: '800' }}>
                        {dueTodayCount} Due Today
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.allClearGlassPill}>
                      <MaterialCommunityIcons name="check-circle" size={12} color="#34D399" />
                      <ThemedText type="caption" style={{ color: '#34D399', fontWeight: '800' }}>
                        All Clear
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {tabs.map((t) => {
            const selected = tab === t.value;
            const chipColor = t.color || theme.accent;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  triggerHaptic();
                  setTab(t.value);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: selected ? chipColor : theme.cardMuted,
                    borderColor: selected ? chipColor : theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.textSecondary, fontSize: 12 }}>
                  {t.label} ({t.count})
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Reminders List */}
        <View style={styles.listSection}>
          {filteredReminders.length === 0 ? (
            <Card style={styles.emptyCard}>
              <EmptyState
                title="No bills or reminders"
                message="Stay on top of electricity bills, rent, EMI, and subscriptions by tapping Add Bill above."
                tone={theme.accent}
              />
            </Card>
          ) : (
            filteredReminders.map((reminder) => (
              <BillCard key={reminder.id} reminder={reminder} formatAmount={safeFormatAmount} />
            ))
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function BillCard({ reminder, formatAmount }: { reminder: ReminderWithDerivedStatus; formatAmount: (amount: number | null) => string }) {
  const theme = useTheme();
  const { deleteReminder, skipReminder } = useFinancialReminders();

  const isOverdue = reminder.derivedStatus === 'overdue';
  const isDueToday = reminder.derivedStatus === 'due_today';
  const isPaid = reminder.derivedStatus === 'paid';
  const isSkipped = reminder.derivedStatus === 'skipped';

  const statusColor = isOverdue
    ? theme.danger
    : isDueToday
      ? '#BD7119'
      : isPaid
        ? '#10B981'
        : theme.accent;

  const statusLabel = isOverdue
    ? `${Math.abs(reminder.daysUntilDue)}d overdue`
    : isDueToday
      ? 'Due today'
      : isPaid
        ? 'Paid'
        : isSkipped
          ? 'Skipped'
          : `Due in ${reminder.daysUntilDue} days`;

  const iconName = getReminderCategoryIcon(reminder.category);

  const handleDelete = () => {
    confirmDelete('Delete reminder?', `Are you sure you want to delete "${reminder.title}"?`, () => {
      deleteReminder(reminder.id);
    });
  };

  return (
    <Card
      style={[
        styles.billCard,
        {
          borderLeftWidth: 4,
          borderLeftColor: statusColor,
          opacity: isPaid || isSkipped ? 0.75 : 1,
        },
      ]}>
      <View style={styles.cardHeader}>
        <View style={[styles.reminderIconBadge, { backgroundColor: `${statusColor}1E` }]}>
          <MaterialCommunityIcons name={iconName} size={20} color={statusColor} />
        </View>

        <View style={styles.titleCopy}>
          <ThemedText type="defaultBold" numberOfLines={1} style={{ fontSize: 15 }}>
            {reminder.title}
          </ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badgePill, { backgroundColor: theme.cardMuted }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 10 }}>
                {reminder.category}
              </ThemedText>
            </View>

            <View style={[styles.badgePill, { backgroundColor: `${statusColor}18` }]}>
              <ThemedText type="caption" style={{ color: statusColor, fontWeight: '800', fontSize: 10 }}>
                {statusLabel}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText type="subtitle" style={[styles.amount, { color: isPaid ? theme.textSecondary : theme.text }]}>
          {formatAmount(reminder.amount)}
        </ThemedText>
      </View>

      <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
        <View style={styles.footerInfo}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={theme.textSecondary} />
          <ThemedText type="caption" themeColor="textSecondary">
            Due: {formatDate(reminder.dueDate)}
            {reminder.repeatType !== 'one-time' ? ` · ${reminder.repeatType}` : ''}
          </ThemedText>
        </View>

        <View style={styles.actionRow}>
          {!isPaid && !isSkipped && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push({ pathname: '/bills/pay/[id]', params: { id: reminder.id } });
              }}
              style={({ pressed }) => [styles.payActionBtn, { backgroundColor: theme.accent }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
              <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '800' }}>Mark Paid</ThemedText>
            </Pressable>
          )}

          {reminder.repeatType !== 'one-time' && !isPaid && !isSkipped && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                skipReminder(reminder.id);
              }}
              style={({ pressed }) => [styles.skipActionBtn, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700' }}>Skip</ThemedText>
            </Pressable>
          )}

          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            style={({ pressed }) => [styles.deleteActionBtn, pressed && styles.pressed]}>
            <MaterialCommunityIcons name="delete-outline" size={18} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 110 },
  container: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingHorizontal: Spacing.three, gap: Spacing.three },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { letterSpacing: 1, fontWeight: '800', fontSize: 10 },
  themeIconButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  heroGlassCard: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: Brand.deep, // #00109D
    borderRadius: Radius.xlarge,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(20, 231, 253, 0.35)',
    shadowColor: Brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBlueOrb: {
    position: 'absolute',
    top: -40,
    right: -30,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(1, 82, 245, 0.45)',
  },
  brightCyanOrb: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(20, 231, 253, 0.3)',
  },
  heroContent: { gap: Spacing.two, zIndex: 2 },
  heroTopline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroLabel: { color: 'rgba(255,255,255,0.75)', letterSpacing: 1, fontSize: 11, fontWeight: '800' },
  glassAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  quickAddText: { color: '#FFFFFF' },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  heroStat: { flex: 1, gap: 2 },
  heroStatLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '700' },
  heroStatVal: { color: '#FFFFFF', fontSize: 32, lineHeight: 38, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.25)' },
  actionPillRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  overdueGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  dueTodayGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  allClearGlassPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  filterScroll: { gap: Spacing.two, paddingVertical: 2 },
  filterChip: { height: 36, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  billCard: { borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  reminderIconBadge: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, gap: 4 },
  badges: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  amount: { fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  payActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  skipActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  deleteActionBtn: { padding: 4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
