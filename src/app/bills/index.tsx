import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { usePreferences } from '@/context/expense-context';
import { getReminderRemainingAmount, hasPartialPayment } from '@/utils/reminder-payment';
import { Brand, MaxContentWidth, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDate } from '@/utils/expense';
import { confirmAction, confirmDelete, notify } from '@/utils/confirm';

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
  const { reminders, payments, isLoading, remindersLoadError, reloadReminders } = useFinancialReminders();
  const { formatAmount } = usePreferences();
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
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear() &&
        r.derivedStatus !== 'paid' &&
        r.derivedStatus !== 'skipped'
      );
    })
    .reduce((sum, r) => sum + (getReminderRemainingAmount(r) ?? 0), 0);

  const filteredReminders = reminders.filter((r) => {
    if (tab === 'due_today') return r.derivedStatus === 'due_today';
    if (tab === 'overdue') return r.derivedStatus === 'overdue';
    if (tab === 'upcoming') return r.derivedStatus === 'upcoming';
    if (tab === 'paid') return r.derivedStatus === 'paid';
    return true; // 'all'
  });

  const tabs: { label: string; value: FilterTab; count: number; color?: string }[] = [
    { label: 'All', value: 'all', count: reminders.length },
    { label: 'Due Today', value: 'due_today', count: dueTodayCount, color: theme.warning },
    { label: 'Overdue', value: 'overdue', count: overdueCount, color: theme.danger },
    { label: 'Upcoming', value: 'upcoming', count: upcomingCount, color: theme.accent },
    { label: 'Paid', value: 'paid', count: paidCount, color: theme.success },
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
                      <MaterialCommunityIcons name="alert-circle" size={12} color={theme.dangerOnBrand} />
                      <ThemedText type="caption" style={{ color: theme.dangerOnBrand, fontWeight: '800' }}>
                        {overdueCount} Overdue
                      </ThemedText>
                    </View>
                  ) : dueTodayCount > 0 ? (
                    <View style={styles.dueTodayGlassPill}>
                      <MaterialCommunityIcons name="clock-alert" size={12} color={theme.warningOnBrand} />
                      <ThemedText type="caption" style={{ color: theme.warningOnBrand, fontWeight: '800' }}>
                        {dueTodayCount} Due Today
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.allClearGlassPill}>
                      <MaterialCommunityIcons name="check-circle" size={12} color={theme.successOnBrand} />
                      <ThemedText type="caption" style={{ color: theme.successOnBrand, fontWeight: '800' }}>
                        All Clear
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Calendar View Banner Button */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/bills/calendar');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open calendar view"
          style={({ pressed }) => [
            styles.calendarBannerCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.calendarBannerIcon, { backgroundColor: theme.accentMuted }]}>
            <MaterialCommunityIcons name="calendar-month" size={22} color={theme.accent} />
          </View>
          <View style={styles.calendarBannerCopy}>
            <ThemedText type="smallBold">Monthly Renewal Calendar</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Tap to view interactive calendar grid of upcoming bills & renewals
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

        {/* Payment history banner button */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/bills/history');
          }}
          accessibilityRole="button"
          accessibilityLabel="Open bill payment history"
          style={({ pressed }) => [
            styles.calendarBannerCard,
            { backgroundColor: theme.card, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <View style={[styles.calendarBannerIcon, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="history" size={22} color={theme.textSecondary} />
          </View>
          <View style={styles.calendarBannerCopy}>
            <ThemedText type="smallBold">Payment History</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {payments.length === 0
                ? 'No bill payments recorded yet'
                : `${payments.length} ${payments.length === 1 ? 'payment' : 'payments'} recorded`}
            </ThemedText>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
        </Pressable>

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
                    backgroundColor: selected ? withAlpha(chipColor, 0.16) : theme.cardMuted,
                    borderColor: selected ? chipColor : theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="smallBold" style={{ color: selected ? chipColor : theme.textSecondary, fontSize: 12 }}>
                  {t.label} ({t.count})
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Reminders List */}
        <View style={styles.listSection}>
          {remindersLoadError ? (
            <Card style={styles.emptyCard}>
              <LoadErrorState
                title="Couldn't load your bills"
                message="Your bills and reminders are safe, but they couldn't be read just now."
                onRetry={reloadReminders}
                isRetrying={isLoading}
              />
            </Card>
          ) : filteredReminders.length === 0 ? (
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
  const remainingAmount = getReminderRemainingAmount(reminder);
  const paidThisCycle = Math.max(0, reminder.paidAmountCurrentCycle ?? 0);
  const isPartiallyPaid = !isPaid && !isSkipped && paidThisCycle > 0 && (remainingAmount ?? 0) > 0;

  const statusColor = isOverdue
    ? theme.danger
    : isDueToday
      ? theme.warning
      : isPaid
        ? theme.success
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
    const message = hasPartialPayment(reminder)
      ? `"${reminder.title}" has a partial payment this cycle. Deleting it removes its payment history; linked expenses stay in Expenses.`
      : `Are you sure you want to delete "${reminder.title}"?`;
    confirmDelete('Delete reminder?', message, async () => {
      try {
        await deleteReminder(reminder.id);
      } catch (error) {
        console.error('[cashtrack] Failed to delete bill reminder', error);
        notify('Could not delete bill', 'Something went wrong while deleting this bill. Please try again.');
      }
    });
  };

  const handleSkip = () => {
    if (hasPartialPayment(reminder)) {
      notify(
        'Partial payment recorded',
        'This bill has a payment applied to the current cycle. Pay the remaining balance before skipping.',
      );
      return;
    }

    confirmAction(
      'Skip this bill?',
      `"${reminder.title}" will move to the next cycle without recording a payment.`,
      async () => {
        try {
          await skipReminder(reminder.id);
        } catch (error) {
          console.error('[cashtrack] Failed to skip bill reminder', error);
          notify(
            'Could not skip bill',
            error instanceof Error && error.message
              ? error.message
              : 'Something went wrong while skipping this bill. Please try again.',
          );
        }
      },
      'Skip',
    );
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

            {isPartiallyPaid && (
              <View style={[styles.badgePill, { backgroundColor: `${theme.warning}18` }]}>
                <ThemedText type="caption" style={{ color: theme.warning, fontWeight: '800', fontSize: 10 }}>
                  Part paid
                </ThemedText>
              </View>
            )}

            {reminder.isAlarm && (
              <View style={[styles.badgePill, { backgroundColor: '#0152F518', flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                <MaterialCommunityIcons name="alarm" size={11} color="#0152F5" />
                <ThemedText type="caption" style={{ color: '#0152F5', fontWeight: '800', fontSize: 10 }}>
                  {reminder.alarmTime ? `Alarm ${reminder.alarmTime}` : 'Alarm'}
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <ThemedText type="subtitle" style={[styles.amount, { color: isPaid ? theme.textSecondary : theme.text }]}>
          {formatAmount(isPaid ? reminder.amount : (remainingAmount ?? reminder.amount))}
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
              accessibilityRole="button"
              accessibilityLabel={`Mark Paid, ${reminder.title}`}
              style={({ pressed }) => [styles.payActionBtn, { backgroundColor: theme.accentFill }, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="check" size={13} color={theme.onBrand} />
              <ThemedText type="caption" style={{ color: theme.onBrand, fontWeight: '800' }}>Mark Paid</ThemedText>
            </Pressable>
          )}

          {reminder.repeatType !== 'one-time' && !isPaid && !isSkipped && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                handleSkip();
              }}
              accessibilityRole="button"
              accessibilityLabel={`Skip ${reminder.title}`}
              style={({ pressed }) => [styles.skipActionBtn, { backgroundColor: theme.cardMuted }, pressed && styles.pressed]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700' }}>Skip</ThemedText>
            </Pressable>
          )}

          {!isPaid && !isSkipped && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                router.push({ pathname: '/bills/edit/[id]', params: { id: reminder.id } });
              }}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Edit ${reminder.title}`}
              style={({ pressed }) => [styles.deleteActionBtn, pressed && styles.pressed]}>
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.textSecondary} />
            </Pressable>
          )}

          <Pressable
            onPress={handleDelete}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${reminder.title}`}
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
    width: 44,
    height: 44,
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
  calendarBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  calendarBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarBannerCopy: { flex: 1, gap: 2 },
  filterChip: { height: 44, paddingHorizontal: Spacing.three, borderRadius: Radius.pill, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  billCard: { borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  reminderIconBadge: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, gap: 4, minWidth: 0 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  amount: { fontSize: 17, lineHeight: 22, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexShrink: 0 },
  payActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  skipActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  deleteActionBtn: { padding: 4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
