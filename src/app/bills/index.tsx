import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { useExpenses } from '@/context/expense-context';
import { Brand, Radius, Spacing } from '@/constants/theme';
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

export default function BillsScreen() {
  const theme = useTheme();
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

  const tabs: { label: string; value: FilterTab; count: number }[] = [
    { label: 'All', value: 'all', count: reminders.length },
    { label: 'Due Today', value: 'due_today', count: dueTodayCount },
    { label: 'Overdue', value: 'overdue', count: overdueCount },
    { label: 'Upcoming', value: 'upcoming', count: upcomingCount },
    { label: 'Paid', value: 'paid', count: paidCount },
  ];

  const safeFormatAmount = (amt: number | null) => (amt !== null ? formatAmount(amt) : 'Variable');

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <View style={styles.heroTopline}>
              <ThemedText type="caption" style={styles.heroLabel}>BILLS & REMINDERS</ThemedText>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/bills/add');
                }}
                accessibilityRole="button"
                accessibilityLabel="Add bill or reminder"
                style={({ pressed }) => [styles.quickAddButton, pressed && styles.pressed]}>
                <ThemedText type="defaultBold" style={styles.quickAddText}>＋ Add Bill</ThemedText>
              </Pressable>
            </View>

            <View style={styles.heroSummaryRow}>
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>DUE THIS MONTH</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {formatAmount(monthDueTotal)}
                </ThemedText>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <ThemedText type="caption" style={styles.heroStatLabel}>ACTION NEEDED</ThemedText>
                <ThemedText type="hero" style={styles.heroStatVal} numberOfLines={1} adjustsFontSizeToFit>
                  {dueTodayCount + overdueCount} items
                </ThemedText>
              </View>
            </View>
          </View>
          <View pointerEvents="none" style={styles.heroOrbLarge} />
          <View pointerEvents="none" style={styles.heroOrbSmall} />
        </View>

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {tabs.map((t) => {
            const selected = tab === t.value;
            return (
              <Pressable
                key={t.value}
                onPress={() => {
                  triggerHaptic();
                  setTab(t.value);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: selected ? theme.accent : theme.cardMuted,
                    borderColor: selected ? theme.accent : theme.border,
                  },
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? '#FFFFFF' : theme.textSecondary }}>
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
        ? '#27AE60'
        : theme.accent;

  const statusLabel = isOverdue
    ? `${Math.abs(reminder.daysUntilDue)} days overdue`
    : isDueToday
      ? 'Due today'
      : isPaid
        ? 'Paid'
        : isSkipped
          ? 'Skipped'
          : `Due in ${reminder.daysUntilDue} days`;

  const handleDelete = () => {
    confirmDelete('Delete reminder?', `Are you sure you want to delete "${reminder.title}"?`, () => {
      deleteReminder(reminder.id);
    });
  };

  return (
    <Card
      style={{
        ...styles.billCard,
        borderLeftWidth: 4,
        borderLeftColor: statusColor,
        opacity: isPaid || isSkipped ? 0.75 : 1,
      }}>
      <View style={styles.cardHeader}>
        <View style={styles.titleCopy}>
          <ThemedText type="defaultBold" numberOfLines={1}>{reminder.title}</ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: theme.cardMuted }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700' }}>
                {reminder.category}
              </ThemedText>
            </View>
            <View style={[styles.badge, { backgroundColor: isOverdue || isDueToday ? 'rgba(235, 87, 87, 0.15)' : 'rgba(39, 174, 96, 0.15)' }]}>
              <ThemedText type="caption" style={{ color: statusColor, fontWeight: '700' }}>
                {statusLabel}
              </ThemedText>
            </View>
          </View>
        </View>
        <ThemedText type="subtitle" style={[styles.amount, { color: isPaid ? theme.textSecondary : theme.text }]}>
          {formatAmount(reminder.amount)}
        </ThemedText>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.footerInfo}>
          <MaterialCommunityIcons name="calendar-outline" size={13} color={theme.textSecondary} />
          <ThemedText type="caption" themeColor="textSecondary">
            Due: {formatDate(reminder.dueDate)}
            {reminder.repeatType !== 'one-time' ? ` · Repeats ${reminder.repeatType}` : ''}
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
              <ThemedText type="caption" style={{ color: '#FFFFFF', fontWeight: '700' }}>Mark Paid</ThemedText>
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
            <MaterialCommunityIcons name="delete-outline" size={17} color={theme.danger} />
          </Pressable>
        </View>
      </View>
    </Card>
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
  quickAddButton: { backgroundColor: '#FFFFFF', borderRadius: Radius.pill, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  quickAddText: { color: Brand.deep },
  heroSummaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, marginVertical: Spacing.half },
  heroStat: { flex: 1, gap: Spacing.half },
  heroStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  heroStatVal: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  heroDivider: { width: StyleSheet.hairlineWidth, height: 36, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroOrbLarge: { position: 'absolute', width: 230, height: 230, borderRadius: 115, right: -90, top: -100, backgroundColor: 'rgba(139,123,255,0.2)' },
  heroOrbSmall: { position: 'absolute', width: 130, height: 130, borderRadius: 65, right: 14, bottom: -90, backgroundColor: 'rgba(176,76,252,0.2)' },
  filterScroll: { gap: Spacing.two, paddingVertical: Spacing.one },
  filterChip: { height: 38, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  billCard: { borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  titleCopy: { flex: 1, gap: Spacing.half },
  badges: { flexDirection: 'row', gap: Spacing.two, alignItems: 'center' },
  badge: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.small },
  amount: { fontSize: 18, lineHeight: 24, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  payActionBtn: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: Radius.pill },
  skipActionBtn: { paddingHorizontal: Spacing.three, paddingVertical: 6, borderRadius: Radius.pill },
  deleteActionBtn: { padding: 4 },
  pressed: { opacity: 0.75 },
});
