import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { glow, Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';
import { QuickAlarmPanel } from '@/components/floating-tools/tools/QuickAlarmPanel';
import { formatClock, formatLap, lapExtremes } from '@/utils/stopwatch';

export function StopwatchTool() {
  const theme = useTheme();
  const { seconds, isRunning, laps, startTimer, pauseTimer, resetTimer, addLap, clearLaps } = useStopwatch();
  const { bestId, worstId } = lapExtremes(laps);

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
            // A soft accent glow only while the timer runs.
            boxShadow: isRunning ? glow(theme.accent) : [],
          },
        ]}>
        <Ionicons name="timer-outline" size={28} color={isRunning ? theme.accent : theme.textSecondary} />
        <ThemedText type="hero" style={[styles.timeText, { color: theme.text }]}>
          {formatClock(seconds)}
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

      <QuickAlarmPanel />

      {/* Lap History Section filling bottom empty space */}
      <View style={[styles.lapSection, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.lapHeader}>
          <View style={styles.lapTitleRow}>
            <Ionicons name="flag-outline" size={14} color={theme.textSecondary} />
            <ThemedText type="smallBold" style={{ fontSize: 11, letterSpacing: 0.5 }}>
              LAP TIMES ({laps.filter((lap) => !lap.label).length})
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
            laps.map((lap, idx) => {
              const isBest = lap.id === bestId;
              const isWorst = lap.id === worstId;
              const tone = isBest ? theme.success : isWorst ? theme.danger : theme.text;
              return (
                <View
                  key={lap.id}
                  accessible
                  accessibilityLabel={
                    lap.label
                      ? `${lap.label} at ${formatLap(lap.totalMs)}`
                      : `Lap ${lap.index}, split ${formatLap(lap.splitMs)}, total ${formatLap(lap.totalMs)}${isBest ? ', fastest' : isWorst ? ', slowest' : ''}`
                  }
                  style={[styles.lapItem, { borderBottomColor: theme.border }, idx === laps.length - 1 && { borderBottomWidth: 0 }]}>
                  <ThemedText type="caption" style={{ color: lap.label ? theme.accent : theme.textSecondary, fontSize: 13, flex: 1 }} numberOfLines={1}>
                    {lap.label ?? `Lap ${lap.index}${isBest ? ' · fastest' : isWorst ? ' · slowest' : ''}`}
                  </ThemedText>
                  {!lap.label && (
                    <ThemedText type="defaultBold" style={{ fontSize: 14, fontVariant: ['tabular-nums'], color: tone, marginRight: Spacing.three }}>
                      +{formatLap(lap.splitMs)}
                    </ThemedText>
                  )}
                  <ThemedText type="caption" style={{ fontSize: 13, fontVariant: ['tabular-nums'], color: theme.textSecondary }}>
                    {formatLap(lap.totalMs)}
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
