import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';

export function StopwatchTool() {
  const theme = useTheme();
  const { seconds, isRunning, startTimer, pauseTimer, resetTimer } = useStopwatch();

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `${String(hrs).padStart(2, '0')}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
          onPress={() => (isRunning ? pauseTimer() : startTimer())}
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
          onPress={resetTimer}
          style={({ pressed }) => [
            styles.actionButton,
            { backgroundColor: theme.cardMuted, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
            pressed && styles.pressed,
          ]}>
          <Ionicons name="refresh" size={20} color={theme.text} />
          <ThemedText type="defaultBold" style={{ color: theme.text }}>
            Reset
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.four,
    paddingBottom: Spacing.six,
  },
  displayCard: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    width: 220,
    height: 220,
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
    height: 52,
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
});
