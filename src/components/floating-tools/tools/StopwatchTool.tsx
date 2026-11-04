import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';
import { QUICK_ALARM_MINUTES } from '@/utils/quick-alarm';

export function StopwatchTool() {
  const theme = useTheme();
  const {
    seconds, isRunning, laps, startTimer, pauseTimer, resetTimer, addLap, clearLaps,
    alarmEndAt, alarmMinutes, startQuickAlarm, cancelQuickAlarm,
  } = useStopwatch();

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  };

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (alarmEndAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [alarmEndAt]);
  const alarmRemaining = alarmEndAt === null ? 0 : Math.min((alarmMinutes ?? 0) * 60, Math.max(0, Math.ceil((alarmEndAt - now) / 1000)));

  const formatCountdown = (totalSecs: number) =>
    `${String(Math.floor(totalSecs / 60)).padStart(2, '0')}:${String(totalSecs % 60).padStart(2, '0')}`;

  const handleSetAlarm = async (minutes: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const ok = await startQuickAlarm(minutes);
    if (!ok) {
      Alert.alert(
        'Alarm not set',
        'Allow notifications (and alarms & reminders on Android) for CashTrack so the alarm can ring. Alarms are not available on web or Expo Go.',
      );
    }
  };

  const handleCancelAlarm = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    cancelQuickAlarm();
  };

  const handleLapOrReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isRunning) {
      addLap();
    } else {
      resetTimer();
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.displayCard,
          {
            backgroundColor: theme.cardMuted,
            borderColor: isRunning ? theme.accent : theme.border,
            shadowColor: theme.accent,
            shadowOpacity: isRunning ? 0.15 : 0,
            shadowRadius: 12,
            elevation: isRunning ? 6 : 0,
          },
        ]}>
        <Ionicons name="timer-outline" size={28} color={isRunning ? theme.accent : theme.textSecondary} />
        <ThemedText type="hero" style={[styles.timeText, { color: theme.text }]}>
          {formatTime(seconds)}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {isRunning ? 'Stopwatch Active' : seconds > 0 ? 'Paused' : 'Ready'}
        </ThemedText>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleStartPause}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Pause stopwatch' : 'Start stopwatch'}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: isRunning ? theme.dangerFill : theme.accentFill },
            pressed && styles.pressed,
          ]}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color={Palette.white} />
          <ThemedText type="defaultBold" style={{ color: Palette.white }}>
            {isRunning ? 'Pause' : 'Start'}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleLapOrReset}
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Record lap' : 'Reset stopwatch'}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.cardMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <Ionicons name={isRunning ? 'flag-outline' : 'refresh'} size={20} color={theme.text} />
          <ThemedText type="defaultBold" style={{ color: theme.text }}>
            {isRunning ? 'Lap' : 'Reset'}
          </ThemedText>
        </Pressable>
      </View>

      {/* Quick alarm */}
      <View style={[styles.alarmSection, { backgroundColor: theme.cardMuted, borderColor: alarmEndAt ? theme.accent : theme.border }]}>
        <View style={styles.lapHeader}>
          <View style={styles.lapTitleRow}>
            <Ionicons name="alarm-outline" size={14} color={alarmEndAt ? theme.accent : theme.textSecondary} />
            <ThemedText type="smallBold" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              QUICK ALARM
            </ThemedText>
          </View>
          {alarmEndAt !== null && (
            <Pressable onPress={handleCancelAlarm} accessibilityRole="button" accessibilityLabel="Cancel quick alarm" hitSlop={8}>
              <ThemedText type="caption" style={{ color: theme.danger, fontSize: 11 }}>Cancel</ThemedText>
            </Pressable>
          )}
        </View>

        {alarmEndAt !== null && (
          <View style={styles.alarmCountdown}>
            <ThemedText type="defaultBold" style={{ fontSize: 22, fontVariant: ['tabular-nums'], color: theme.accent }}>
              {formatCountdown(alarmRemaining)}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Rings in {alarmMinutes} min alarm
            </ThemedText>
          </View>
        )}

        <View style={styles.chipRow}>
          {QUICK_ALARM_MINUTES.map((m) => {
            const active = alarmEndAt !== null && alarmMinutes === m;
            return (
              <Pressable
                key={m}
                onPress={() => handleSetAlarm(m)}
                accessibilityRole="button"
                accessibilityLabel={`Set ${m} minute alarm`}
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [
                  styles.chip,
                  {
                    backgroundColor: active ? theme.accentFill : theme.card,
                    borderColor: active ? theme.accent : theme.border,
                  },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="defaultBold" style={{ fontSize: 14, color: active ? Palette.white : theme.text }}>
                  {m}
                </ThemedText>
                <ThemedText type="caption" style={{ fontSize: 10, color: active ? Palette.white : theme.textSecondary }}>
                  min
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Lap History Section filling bottom empty space */}
      <View style={[styles.lapSection, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.lapHeader}>
          <View style={styles.lapTitleRow}>
            <Ionicons name="flag-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="smallBold" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              LAP TIMES ({laps.length})
            </ThemedText>
          </View>
          {laps.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                clearLaps();
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear lap times"
              hitSlop={8}>
              <ThemedText type="caption" style={{ color: theme.danger, fontSize: 11 }}>Clear</ThemedText>
            </Pressable>
          )}
        </View>

        <ScrollView style={styles.lapScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {laps.length === 0 ? (
            <ThemedText type="caption" themeColor="textSecondary" style={styles.emptyLapText}>
              Record laps while the stopwatch is running
            </ThemedText>
          ) : (
            laps.map((lapTime, idx) => {
              const lapNum = laps.length - idx;
              return (
                <View
                  key={idx}
                  style={[styles.lapItem, { borderBottomColor: theme.border }, idx === laps.length - 1 && { borderBottomWidth: 0 }]}>
                  <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 13 }}>
                    Lap {lapNum}
                  </ThemedText>
                  <ThemedText type="defaultBold" style={{ fontSize: 14, fontVariant: ['tabular-nums'] }}>
                    {lapTime}
                  </ThemedText>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
  },
  displayCard: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  timeText: {
    fontSize: 32,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  alarmSection: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
    gap: Spacing.two,
  },
  alarmCountdown: {
    alignItems: 'center',
    gap: 2,
  },
  chipRow: {
    flexDirection: 'row',
    gap: Spacing.one,
  },
  chip: {
    flex: 1,
    minHeight: 48,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lapSection: {
    width: '100%',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.large,
    padding: Spacing.two,
    marginTop: Spacing.one,
    gap: 4,
  },
  lapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  lapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lapScroll: {
    maxHeight: 130,
  },
  emptyLapText: {
    textAlign: 'center',
    paddingVertical: 12,
    fontSize: 12,
  },
  lapItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
