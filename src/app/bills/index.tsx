import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card, CardDivider } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { Chip, ListRow, Screen, StatStrip } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { usePreferences } from '@/context/expense-context';
import { getReminderRemainingAmount, hasPartialPayment } from '@/utils/reminder-payment';
import { Brand, Radius, Spacing, withAlpha } from '@/constants/theme';
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
    <Screen topInset={false}>
        <StatStrip
          items={[
            { label: 'Due this month', value: formatAmount(monthDueTotal) },
            overdueCount > 0
      ? { label: 'Needs action', value: `${overdueCount} overdue`, tone: 'danger' as const }
      : dueTodayCount > 0
        ? { label: 'Needs action', value: `${dueTodayCount} due today`, tone: 'warning' as const }
        : { label: 'Needs action', value: 'All clear', tone: 'success' as const },
          ]}
        />

        <Card padded={false}>
          <ListRow
            title="Monthly renewal calendar"
            subtitle="See upcoming bills and renewals by date"
            icon="calendar-month-outline"
            color={theme.accent}
            onPress={() => {
              triggerHaptic();
              router.push('/bills/calendar');
            }}
          />
          <CardDivider />
          <ListRow
            title="Payment history"
            subtitle={
              payments.length === 0
                ? 'No bill payments recorded yet'
                : `${payments.length} ${payments.length === 1 ? 'payment' : 'payments'} recorded`
            }
            icon="history"
            color={theme.textSecondary}
            onPress={() => {
              triggerHaptic();
              router.push('/bills/history');
            }}
          />
        </Card>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {tabs.map((t) => (
            <Chip
              key={t.value}
              label={`${t.label} (${t.count})`}
              selected={tab === t.value}
              onPress={() => {
                triggerHaptic();
                setTab(t.value);
              }}
            />
          ))}
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
                message="Stay on top of electricity bills, rent, EMI, and subscriptions."
                tone={theme.accent}
                icon="calendar-clock"
                actionLabel="Add bill"
                onAction={() => router.push('/bills/add')}
              />
            </Card>
          ) : (
            filteredReminders.map((reminder) => (
              <BillCard key={reminder.id} reminder={reminder} formatAmount={safeFormatAmount} />
            ))
          )}
        </View>
    </Screen>
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
          <ThemedText type="defaultBold" numberOfLines={1} style={{ fontSize: 16 }}>
            {reminder.title}
          </ThemedText>
          <View style={styles.badges}>
            <View style={[styles.badgePill, { backgroundColor: theme.cardMuted }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                {reminder.category}
              </ThemedText>
            </View>

            <View style={[styles.badgePill, { backgroundColor: `${statusColor}18` }]}>
              <ThemedText type="caption" style={{ color: statusColor, fontWeight: '800', fontSize: 11 }}>
                {statusLabel}
              </ThemedText>
            </View>

            {isPartiallyPaid && (
              <View style={[styles.badgePill, { backgroundColor: `${theme.warning}18` }]}>
                <ThemedText type="caption" style={{ color: theme.warning, fontWeight: '800', fontSize: 11 }}>
                  Part paid
                </ThemedText>
              </View>
            )}

            {reminder.isAlarm && (
              <View style={[styles.badgePill, { backgroundColor: withAlpha(Brand.primary, 0.09), flexDirection: 'row', alignItems: 'center', gap: 3 }]}>
                <MaterialCommunityIcons name="alarm" size={11} color={Brand.primary} />
                <ThemedText type="caption" style={{ color: Brand.primary, fontWeight: '800', fontSize: 11 }}>
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
  filterScroll: { gap: Spacing.two, paddingVertical: 2 },
  listSection: { gap: Spacing.two },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  billCard: { borderRadius: Radius.large, padding: Spacing.three, gap: Spacing.two },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two },
  reminderIconBadge: { width: 42, height: 42, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  titleCopy: { flex: 1, gap: 4, minWidth: 0 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.pill },
  amount: { fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] },
  cardFooter: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.two },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, minWidth: 0 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexShrink: 0 },
  payActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  skipActionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill },
  deleteActionBtn: { padding: 4 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
