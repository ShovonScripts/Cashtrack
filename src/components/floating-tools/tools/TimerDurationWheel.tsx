import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useCallback, useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Elevation, MinTouchTarget, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatClock, formatDurationLabel, MAX_TIMER_MS } from '@/utils/stopwatch';

const MINUTES_PER_NOTCH = 1;
const DRAG_PIXELS_PER_NOTCH = 12;
const MAX_MINUTES = Math.floor(MAX_TIMER_MS / 60_000);
const MAX_TICKS_PER_UPDATE = 4;
const TICK_COUNT = 48;

type TimerDurationWheelProps = {
  minutes: number;
  onMinutesChange: (minutes: number) => void;
  onStart: () => void;
  loading: boolean;
};

export function TimerDurationWheel({ minutes, onMinutesChange, onStart, loading }: TimerDurationWheelProps) {
  const theme = useTheme();
  const player = useAudioPlayer(require('../../../../assets/sounds/timer_tick.wav'));
  const adjustRef = useRef<(steps: number) => void>(() => {});
  const wheelDeltaRef = useRef(0);
  const selectedMinutes = useSharedValue(minutes);
  const wheelWidth = useSharedValue(0);
  const dragDistance = useSharedValue(0);
  const lastTranslationX = useSharedValue(0);
  const rollerOffset = useSharedValue(0);

  useEffect(() => {
    selectedMinutes.set(minutes);
  }, [minutes, selectedMinutes]);

  const playTick = useCallback(() => {
    void player
      .seekTo(0)
      .then(() => player.play())
      .catch((error: unknown) => console.warn('Timer wheel tick could not be played.', error));
  }, [player]);

  const adjust = useCallback(
    (steps: number) => {
      if (steps === 0) return;
      const current = selectedMinutes.get();
      const next = Math.min(MAX_MINUTES, Math.max(1, current + steps * MINUTES_PER_NOTCH));
      const actualSteps = next - current;
      if (actualSteps === 0) return;

      selectedMinutes.set(next);
      onMinutesChange(next);
      for (let index = 0; index < Math.min(MAX_TICKS_PER_UPDATE, Math.abs(actualSteps)); index += 1) playTick();
      rollerOffset.set(
        withSequence(
          withTiming(actualSteps > 0 ? -7 : 7, { duration: 45 }),
          withTiming(0, { duration: 105 }),
        ),
      );
    },
    [onMinutesChange, playTick, rollerOffset, selectedMinutes],
  );

  useEffect(() => {
    adjustRef.current = adjust;
  }, [adjust]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('#timer-duration-wheel')) return;

      event.preventDefault();
      const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
      wheelDeltaRef.current += event.deltaY * deltaScale;
      const steps = Math.trunc(wheelDeltaRef.current / 100);
      if (steps !== 0) {
        wheelDeltaRef.current -= steps * 100;
        adjustRef.current(-steps);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .onBegin(() => {
      dragDistance.set(0);
      lastTranslationX.set(0);
    })
    .onStart((event) => {
      dragDistance.set(event.translationX);
      lastTranslationX.set(event.translationX);
      rollerOffset.set(event.translationX * -0.45);
      const steps = Math.trunc(event.translationX / DRAG_PIXELS_PER_NOTCH);
      if (steps !== 0) {
        dragDistance.set(event.translationX - steps * DRAG_PIXELS_PER_NOTCH);
        scheduleOnRN(adjust, steps);
      }
    })
    .onUpdate((event) => {
      const movement = event.translationX - lastTranslationX.get();
      lastTranslationX.set(event.translationX);
      dragDistance.set(dragDistance.get() + movement);

      const steps = Math.trunc(dragDistance.get() / DRAG_PIXELS_PER_NOTCH);
      if (steps !== 0) {
        dragDistance.set(dragDistance.get() - steps * DRAG_PIXELS_PER_NOTCH);
        scheduleOnRN(adjust, steps);
      }
      rollerOffset.set(dragDistance.get() * -0.45);
    })
    .onEnd(() => {
      dragDistance.set(0);
      lastTranslationX.set(0);
      rollerOffset.set(withSpring(0, { damping: 16, stiffness: 240 }));
    });

  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd((event, success) => {
      if (success) scheduleOnRN(adjust, event.x < wheelWidth.get() / 2 ? -1 : 1);
    });
  const wheelGesture = Gesture.Race(panGesture, tapGesture);

  const animatedRidgeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: rollerOffset.get() }],
  }));

  const changeOneMinute = (direction: -1 | 1) => adjust(direction);
  const selectedLabel = formatDurationLabel(minutes * 60_000);

  return (
    <View style={styles.selector}>
      <View style={styles.selectorHeader}>
        <View style={styles.durationCopy}>
          <ThemedText type="caption" themeColor="textSecondary">
            SELECTED DURATION
          </ThemedText>
          <ThemedText
            type="defaultBold"
            style={[styles.duration, { color: theme.text }]}
            accessibilityLiveRegion="polite">
            {formatClock(minutes * 60)}
          </ThemedText>
        </View>
        <Button
          label="Start"
          accessibilityLabel={`Start timer for ${selectedLabel}`}
          onPress={onStart}
          loading={loading}
          style={styles.startButton}
        />
      </View>

      <View style={styles.wheelRow}>
        <Pressable
          onPress={() => changeOneMinute(-1)}
          disabled={minutes <= 1}
          accessibilityRole="button"
          accessibilityLabel="Decrease timer by one minute"
          style={({ pressed }) => [
            styles.stepButton,
            { borderColor: theme.border, backgroundColor: theme.card },
            minutes <= 1 && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name="minus" size={20} color={theme.textSecondary} />
        </Pressable>

        <GestureDetector gesture={wheelGesture}>
          <View
            nativeID="timer-duration-wheel"
            onLayout={(event) => wheelWidth.set(event.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Horizontal timer duration wheel"
            accessibilityHint="Tap the left or right side, or drag horizontally, to adjust one minute at a time."
            accessibilityValue={{
              min: 1,
              max: MAX_MINUTES,
              now: minutes,
              text: selectedLabel,
            }}
            style={[styles.wheelHousing, Elevation.medium]}>
            <View style={styles.housingHighlight} />
            <View style={styles.rollerTrack}>
              <Animated.View style={[styles.ridgeStrip, animatedRidgeStyle]}>
                {Array.from({ length: TICK_COUNT }, (_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.ridge,
                      {
                        backgroundColor: index % 2 === 0 ? '#C3C9D0' : '#747B83',
                        borderTopColor: index % 2 === 0 ? '#F3F5F7' : '#A8AFB7',
                        borderLeftColor: index % 2 === 0 ? '#F3F5F7' : '#A8AFB7',
                        borderRightColor: index % 2 === 0 ? '#636A72' : '#34383D',
                        borderBottomColor: index % 2 === 0 ? '#51575E' : '#292D32',
                      },
                    ]}
                  />
                ))}
              </Animated.View>
              <View pointerEvents="none" style={styles.rollerTopHighlight} />
              <View pointerEvents="none" style={styles.rollerBottomShade} />
              <View pointerEvents="none" style={[styles.rollerBearing, styles.leftBearing]} />
              <View pointerEvents="none" style={[styles.rollerBearing, styles.rightBearing]} />
            </View>
            <View style={styles.housingBottomEdge} />
          </View>
        </GestureDetector>

        <Pressable
          onPress={() => changeOneMinute(1)}
          disabled={minutes >= MAX_MINUTES}
          accessibilityRole="button"
          accessibilityLabel="Increase timer by one minute"
          style={({ pressed }) => [
            styles.stepButton,
            { borderColor: theme.border, backgroundColor: theme.card },
            minutes >= MAX_MINUTES && styles.disabled,
            pressed && styles.pressed,
          ]}>
          <MaterialCommunityIcons name="plus" size={20} color={theme.textSecondary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    width: '100%',
    gap: Spacing.two,
  },
  selectorHeader: {
    minHeight: MinTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  durationCopy: { flex: 1, gap: 1 },
  duration: { fontSize: 20, fontVariant: ['tabular-nums'], letterSpacing: 0.5 },
  startButton: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.two,
  },
  wheelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepButton: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.medium,
  },
  wheelHousing: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 5,
    paddingVertical: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: '#777E86',
    borderRightColor: '#111316',
    borderBottomColor: '#08090B',
    borderLeftColor: '#4C535A',
    borderRadius: 7,
    backgroundColor: '#1C1F23',
    boxShadow: '0 3px 8px rgba(0, 0, 0, 0.45)',
    cursor: 'ew-resize',
    touchAction: 'pan-y',
    userSelect: 'none',
  },
  housingHighlight: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.34)',
  },
  rollerTrack: {
    height: 32,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: '#08090A',
    borderRightColor: '#444B52',
    borderBottomColor: '#666D74',
    borderLeftColor: '#090A0C',
    borderRadius: 3,
    backgroundColor: '#101215',
  },
  ridgeStrip: {
    position: 'absolute',
    left: -16,
    right: -16,
    height: 26,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  ridge: {
    width: 3,
    height: 26,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  rollerTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  rollerBottomShade: {
    position: 'absolute',
    bottom: 0,
    left: 2,
    right: 2,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.48)',
  },
  rollerBearing: {
    position: 'absolute',
    top: 1,
    bottom: 1,
    width: 5,
    borderWidth: 1,
    borderTopColor: '#B7BDC3',
    borderRightColor: '#08090A',
    borderBottomColor: '#08090A',
    borderLeftColor: '#555C64',
    borderRadius: 2,
    backgroundColor: '#30363D',
    zIndex: 1,
  },
  leftBearing: { left: 1 },
  rightBearing: { right: 1 },
  housingBottomEdge: {
    position: 'absolute',
    right: 8,
    bottom: 2,
    left: 8,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.78 },
});
