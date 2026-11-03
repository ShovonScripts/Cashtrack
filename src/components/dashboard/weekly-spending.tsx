import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { totalForDate } from '@/utils/expense';
import { Expense } from '@/types/expense';
import { getWeekDays } from '@/utils/period-summary';
import { triggerHaptic } from '@/utils/haptics';

type DaySpend = {
  date: Date;
  label: string;
  amount: number;
};

function getWeekSpending(expenses: Expense[], today: Date, firstDayOfWeek: 'monday' | 'sunday'): DaySpend[] {
  return getWeekDays(today, firstDayOfWeek).map((date) => ({
    date,
    label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
    amount: totalForDate(expenses, date),
  }));
}


export function WeeklySpending({ expenses, today, firstDayOfWeek, formatAmount }: { expenses: Expense[]; today: Date; firstDayOfWeek: 'monday' | 'sunday'; formatAmount: (amount: number) => string }) {
  const theme = useTheme();
  const days = getWeekSpending(expenses, today, firstDayOfWeek);
  const maxAmount = Math.max(...days.map((day) => day.amount), 1);
  const weeklyTotal = days.reduce((total, day) => total + day.amount, 0);
  const dailyAvg = Math.round(weeklyTotal / 7);
  const activeDaysCount = days.filter((day) => day.amount > 0).length;

  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const selectedDay = selectedDayIndex !== null ? days[selectedDayIndex] : null;

  return (
    <Card style={styles.weekCard}>
      <View style={styles.sectionTitleRow}>
        <View style={styles.sectionTitleCopy}>
          <ThemedText type="defaultBold">
            {selectedDay ? new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(selectedDay.date) : 'This week'}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {selectedDay ? (selectedDay.amount > 0 ? `Spent ${formatAmount(selectedDay.amount)}` : 'No expenses recorded') : `Daily avg: ${formatAmount(dailyAvg)} · ${activeDaysCount}/7 active days`}
          </ThemedText>
        </View>
        <Pressable
          onPress={() => {
            triggerHaptic();
            setSelectedDayIndex(null);
          }}
          accessibilityRole="button"
          accessibilityLabel="Reset view to weekly total"
          style={[styles.weekTotalBadge, { backgroundColor: theme.accentMuted }]}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {selectedDay ? formatAmount(selectedDay.amount) : formatAmount(weeklyTotal)}
          </ThemedText>
        </Pressable>
      </View>

      <View
        style={styles.chart}
        accessible
        accessibilityLabel={`Spending over the last seven days totals ${formatAmount(weeklyTotal)}`}>
        {days.map((day, index) => {
          const isToday = day.date.toDateString() === today.toDateString();
          const isSelected = selectedDayIndex === index;
          const barHeight = day.amount > 0 ? Math.max(10, (day.amount / maxAmount) * 78) : 6;
          return (
            <Pressable
              key={day.date.toISOString()}
              onPress={() => {
                triggerHaptic();
                setSelectedDayIndex(isSelected ? null : index);
              }}
              accessibilityRole="button"
              style={styles.chartColumn}
              accessible
              accessibilityLabel={`${new Intl.DateTimeFormat('en', { weekday: 'long' }).format(day.date)}: ${formatAmount(day.amount)}`}>
              <View style={[styles.barTrack, { backgroundColor: theme.cardMuted }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: isSelected ? theme.text : isToday ? theme.accent : day.amount > 0 ? theme.accent : theme.border,
                      opacity: day.amount > 0 ? 1 : 0.35,
                    },
                  ]}
                />
              </View>
              <ThemedText
                type="caption"
                themeColor={isSelected || isToday ? 'text' : 'textSecondary'}
                style={isSelected || isToday ? styles.todayLabel : undefined}>
                {day.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}


const styles = StyleSheet.create({
  weekCard: {
    gap: Spacing.three,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleCopy: {
    gap: 2,
  },
  weekTotalBadge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.half,
    borderRadius: Radius.pill,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 116,
    paddingTop: Spacing.two,
  },
  chartColumn: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    width: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    overflow: 'hidden',
    paddingBottom: 2,
  },
  bar: {
    width: 16,
    borderRadius: Radius.pill,
  },
  todayLabel: {
    fontWeight: '700',
  },
});
