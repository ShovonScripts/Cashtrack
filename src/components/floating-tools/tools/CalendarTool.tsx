import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useFinancialReminders, type ReminderWithDerivedStatus } from '@/context/financial-reminders-context';
import { useExpenses } from '@/context/expense-context';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CalendarTool({ onNavigate }: { onNavigate?: () => void }) {
  const theme = useTheme();
  const { reminders } = useFinancialReminders();
  const { formatAmount } = useExpenses();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(currentDate);
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDate());

  const changeMonth = (offset: number) => {
    setCurrentDate((cur) => {
      // Anchor on day 1 so months with fewer days never cause a skip.
      return new Date(cur.getFullYear(), cur.getMonth() + offset, 1);
    });
    setSelectedDay(1);
  };

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
    <View style={styles.container}>
      {/* Month Navigation */}
      <Card style={styles.monthCard}>
        <Pressable
          onPress={() => changeMonth(-1)}
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          hitSlop={8}
          style={[styles.arrowBtn, { backgroundColor: theme.cardMuted }]}>
          <Ionicons name="chevron-back" size={18} color={theme.text} />
        </Pressable>
        <ThemedText type="defaultBold">{monthLabel}</ThemedText>
        <Pressable
          onPress={() => changeMonth(1)}
          accessibilityRole="button"
          accessibilityLabel="Next month"
          hitSlop={8}
          style={[styles.arrowBtn, { backgroundColor: theme.cardMuted }]}>
          <Ionicons name="chevron-forward" size={18} color={theme.text} />
        </Pressable>
      </Card>

      {/* Mini Calendar Grid */}
      <Card style={styles.gridCard}>
        <View style={styles.weekdayRow}>
          {WEEKDAYS.map((wd) => (
            <View key={wd} style={styles.weekdayCell}>
              <ThemedText type="caption" style={{ fontWeight: '700', color: theme.textSecondary, fontSize: 11 }}>
                {wd}
              </ThemedText>
            </View>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.dayCellEmpty} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const isSelected = selectedDay === dayNum;
            const dayRems = remindersByDay.get(dayNum) ?? [];
            const hasBills = dayRems.length > 0;

            return (
              <Pressable
                key={`day-${dayNum}`}
                onPress={() => setSelectedDay(dayNum)}
                accessibilityRole="button"
                accessibilityLabel={`${dayNum}${hasBills ? `, ${dayRems.length} bill${dayRems.length === 1 ? '' : 's'}` : ''}`}
                accessibilityState={{ selected: isSelected }}
                style={[
                  styles.dayCell,
                  {
                    backgroundColor: isSelected ? theme.accentFill : hasBills ? theme.cardMuted : 'transparent',
                    borderColor: hasBills && !isSelected ? theme.accent : 'transparent',
                    borderWidth: hasBills && !isSelected ? 1 : 0,
                  },
                ]}>
                <ThemedText
                  type="caption"
                  style={{
                    fontWeight: isSelected || hasBills ? '700' : '400',
                    color: isSelected ? '#FFFFFF' : theme.text,
                  }}>
                  {dayNum}
                </ThemedText>
                {hasBills && (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? '#FFFFFF' : theme.accent },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Selected Day Schedule */}
      <View style={styles.scheduleSection}>
        <ThemedText type="smallBold">
          Schedule for {monthLabel.split(' ')[0]} {selectedDay}
        </ThemedText>

        {selectedDayReminders.length === 0 ? (
          <Card style={styles.emptyDayCard}>
            <ThemedText type="caption" themeColor="textSecondary">No bills due on this day.</ThemedText>
          </Card>
        ) : (
          selectedDayReminders.map((rem) => (
            <Card key={rem.id} style={styles.reminderRowCard}>
              <View style={styles.reminderInfo}>
                <ThemedText type="smallBold" numberOfLines={1}>{rem.title}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">{rem.category} · {rem.amount !== null ? formatAmount(rem.amount) : 'Variable'}</ThemedText>
              </View>
            </Card>
          ))
        )}
      </View>

      {/* Open Full Calendar Button */}
      <Pressable
        onPress={() => {
          onNavigate?.();
          router.push('/bills/calendar');
        }}
        accessibilityRole="button"
        accessibilityLabel="Open full renewal calendar"
        style={[styles.fullCalendarBtn, { backgroundColor: theme.cardMuted }]}>
        <MaterialCommunityIcons name="calendar-month" size={16} color={theme.accent} />
        <ThemedText type="smallBold" style={{ color: theme.accent }}>Open Full Renewal Calendar →</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  monthCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing.two },
  arrowBtn: { width: 32, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  gridCard: { padding: Spacing.three },
  weekdayRow: { flexDirection: 'row', marginBottom: Spacing.two },
  weekdayCell: { flex: 1, alignItems: 'center' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCellEmpty: { width: `${100 / 7}%`, aspectRatio: 1 },
  dayCell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.medium, padding: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  scheduleSection: { gap: Spacing.two },
  emptyDayCard: { padding: Spacing.three, alignItems: 'center' },
  reminderRowCard: { padding: Spacing.three },
  reminderInfo: { gap: 2 },
  fullCalendarBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.three, borderRadius: Radius.medium },
});
