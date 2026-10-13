import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';

export function StopwatchTool() {
  const theme = useTheme();
  const { seconds, isRunning, laps, startTimer, pauseTimer, resetTimer, addLap, clearLaps } = useStopwatch();

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
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: isRunning ? theme.danger : theme.accent },
            pressed && styles.pressed,
          ]}>
          <Ionicons name={isRunning ? 'pause' : 'play'} size={20} color="#FFFFFF" />
          <ThemedText type="defaultBold" style={{ color: '#FFFFFF' }}>
            {isRunning ? 'Pause' : 'Start'}
          </ThemedText>
        </Pressable>

        <Pressable
          onPress={handleLapOrReset}
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
    height: 48,
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
