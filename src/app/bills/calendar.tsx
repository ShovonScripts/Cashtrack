import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { usePreferences } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';
import { withAlpha } from '@/utils/color';
import { getReminderRemainingAmount } from '@/utils/reminder-payment';

function triggerHaptic() {
  if (Platform.OS !== 'web') {
    try {
      void Haptics.selectionAsync();
    } catch {}
  }
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function BillCalendarScreen() {
  const theme = useTheme();
  const { reminders } = useFinancialReminders();
  const { formatAmount } = usePreferences();
  const { width } = useWindowDimensions();

  // Seven 44dp cells plus container/card padding overflow a 360dp screen.
  // Size the grid to the space that is actually available, capped at 44dp.
  const dayCellSize = Math.max(
    32,
    Math.min(44, Math.floor((Math.min(width, MaxContentWidth) - Spacing.three * 4) / 7)),
  );

  const [currentDate, setCurrentDate] = useState(() => new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(currentDate);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const changeMonth = (offset: number) => {
    triggerHaptic();
    setCurrentDate((cur) => {
      // Anchor on day 1 so months with fewer days never cause a skip
      // (e.g. Jan 31 + 1 month must be February, not March 3).
      return new Date(cur.getFullYear(), cur.getMonth() + offset, 1);
    });
    setSelectedDay(1);
  };

  // Map reminders to days of this month
  const remindersForMonth = reminders.filter((r) => {
    const d = new Date(r.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const remindersByDay = new Map<number, ReminderWithDerivedStatus[]>();
  for (const rem of remindersForMonth) {
    const dayNum = new Date(rem.dueDate).getDate();
    const list = remindersByDay.get(dayNum) ?? [];
    list.push(rem);
    remindersByDay.set(dayNum, list);
  }

  const selectedDayReminders = remindersByDay.get(selectedDay) ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.container}>
        {/* Header Intro */}
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.eyebrow}>
              BILL & SUBSCRIPTION CALENDAR
            </ThemedText>
            <ThemedText type="title">Renewal Calendar</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Interactive schedule of all upcoming bills and renewals.
            </ThemedText>
          </View>
        </View>

        {/* Month Selector Card */}
        <Card style={styles.monthSelectorCard}>
          <Pressable
            onPress={() => changeMonth(-1)}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-left" size={22} color={theme.text} />
          </Pressable>

          <View style={styles.monthLabelBlock}>
            <ThemedText type="defaultBold" style={styles.monthLabelText}>
              {monthLabel}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {remindersForMonth.length} {remindersForMonth.length === 1 ? 'bill' : 'bills'} scheduled
            </ThemedText>
          </View>

          <Pressable
            onPress={() => changeMonth(1)}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={[styles.monthArrow, { backgroundColor: theme.cardMuted }]}>
            <MaterialCommunityIcons name="chevron-right" size={22} color={theme.text} />
          </Pressable>
        </Card>

        {/* Calendar Grid Card */}
        <Card style={styles.calendarCard}>
          {/* Weekday header */}
          <View style={styles.weekdayHeaderRow}>
            {WEEKDAYS.map((wd) => (
              <View key={wd} style={[styles.weekdayCell, { width: dayCellSize }]}>
                <ThemedText type="caption" style={{ fontWeight: '800', color: theme.textSecondary, fontSize: 11 }}>
                  {wd}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Days grid */}
          <View style={styles.daysGrid}>
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <View key={`empty-${i}`} style={[styles.dayCellEmpty, { width: dayCellSize, height: dayCellSize }]} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const isSelected = selectedDay === dayNum;
              const dayRems = remindersByDay.get(dayNum) ?? [];
              const hasBills = dayRems.length > 0;
              const hasOverdue = dayRems.some((r) => r.derivedStatus === 'overdue');

              return (
                <Pressable
                  key={`day-${dayNum}`}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedDay(dayNum);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Day ${dayNum}, ${dayRems.length} bills`}
                  style={[
                    styles.dayCell,
                    {
                      width: dayCellSize,
                      height: dayCellSize,
                      backgroundColor: isSelected ? theme.accentMuted : theme.cardMuted,
                      borderColor: isSelected ? theme.accent : theme.border,
                    },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={{
                      color: isSelected ? theme.accent : theme.text,
                      fontWeight: isSelected ? '800' : '600',
                    }}>
                    {dayNum}
                  </ThemedText>
                  {hasBills && (
                    <View
                      style={[
                        styles.billDotBadge,
                        { backgroundColor: hasOverdue ? theme.danger : theme.accent },
                      ]}
                    />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Card>

        {/* Selected Day Bills Header & List */}
        <View style={styles.sectionHeader}>
          <ThemedText type="defaultBold">
            Bills on {monthLabel.split(' ')[0]} {selectedDay}, {year}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {selectedDayReminders.length} {selectedDayReminders.length === 1 ? 'item' : 'items'}
          </ThemedText>
        </View>

        {selectedDayReminders.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText type="small" themeColor="textSecondary" style={{ textAlign: 'center' }}>
              No bills or subscriptions scheduled for this day.
            </ThemedText>
          </Card>
        ) : (
          <Card style={{ gap: Spacing.two }}>
            {selectedDayReminders.map((rem) => {
              const isPaid = rem.derivedStatus === 'paid';
              const isOverdue = rem.derivedStatus === 'overdue';
              const badgeColor = isPaid ? theme.success : isOverdue ? theme.danger : theme.accent;
              const remainingAmount = getReminderRemainingAmount(rem);
              const isPartiallyPaid =
                !isPaid && Math.max(0, rem.paidAmountCurrentCycle ?? 0) > 0 && (remainingAmount ?? 0) > 0;

              return (
                <Pressable
                  key={rem.id}
                  onPress={() => {
                    triggerHaptic();
                    router.push({ pathname: '/bills/pay/[id]', params: { id: rem.id } });
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Manage ${rem.title}`}
                  style={({ pressed }) => [styles.billRowItem, pressed && styles.pressed]}>
                  <View style={[styles.billIconBadge, { backgroundColor: withAlpha(badgeColor, 0.15) }]}>
                    <MaterialCommunityIcons
                      name={rem.category === 'Subscription' ? 'repeat' : 'calendar-clock'}
                      size={18}
                      color={badgeColor}
                    />
                  </View>
                  <View style={styles.billCopy}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {rem.title}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {rem.category} · {rem.repeatType}
                    </ThemedText>
                  </View>
                  <View style={styles.billRight}>
                    <ThemedText type="smallBold" style={{ color: badgeColor }}>
                      {isPaid ? (rem.amount !== null ? formatAmount(rem.amount) : 'Paid') : remainingAmount !== null ? formatAmount(remainingAmount) : 'Variable'}
                    </ThemedText>
                    <ThemedText type="caption" style={{ color: badgeColor, fontWeight: '700' }}>
                      {isPaid ? 'Paid' : isPartiallyPaid ? 'Part paid' : isOverdue ? 'Overdue' : 'Due'}
                    </ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: 110 },
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: { marginTop: Spacing.two, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerCopy: { flex: 1, gap: 1 },
  eyebrow: { letterSpacing: 1, fontWeight: '800', fontSize: 10 },
  monthSelectorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.two,
  },
  monthArrow: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabelBlock: { flex: 1, alignItems: 'center', gap: 2 },
  monthLabelText: { fontSize: 16, fontWeight: '800' },
  calendarCard: { padding: Spacing.three, gap: Spacing.two },
  weekdayHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingBottom: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e4e4ed',
  },
  weekdayCell: { alignItems: 'center' },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  dayCellEmpty: {},
  dayCell: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  billDotBadge: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.one,
  },
  emptyCard: { padding: Spacing.four, alignItems: 'center' },
  billRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 4,
  },
  billIconBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billCopy: { flex: 1, gap: 1 },
  billRight: { alignItems: 'flex-end', gap: 1 },
  pressed: { opacity: 0.75, transform: [{ scale: 0.99 }] },
});
