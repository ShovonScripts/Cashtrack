import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui';
import { Elevation, MinTouchTarget, Radius, Spacing, WheelColors } from '@/constants/theme';
import { formatDurationLabel, MAX_TIMER_MS } from '@/utils/stopwatch';

/** How far you drag sideways for the drum to turn by one minute. */
const DRAG_PIXELS_PER_NOTCH = 12;
/** One tick sound per notch gets noisy when a fast flick turns many at once. */
const MAX_TICKS_PER_UPDATE = 4;
/** How far the drum rocks while you drag, as a share of the leftover drag. */
const ROCK_FACTOR = 0.45;

/** Rendered positions around the current value: ..-2, -1, centre, +1, +2. */
const SLOTS = [-2, -1, 0, 1, 2] as const;
/** Wide enough for the largest value the drum reaches (1439). */
const ITEM_WIDTH = 56;
const FACE_HEIGHT = 46;
/** Knurled grip bands along the top and bottom edge of the drum. */
const RAIL_HEIGHT = 8;
const RIDGE_COUNT = 48;
/** Rails run past both ends so the rock never slides a gap into view. */
const RAIL_OVERSHOOT = 16;
/** The cylinder curving away at each end of the window. */
const EDGE_SHADE = 16;

const MIN_MINUTES = 1;
const MAX_MINUTES = Math.floor(MAX_TIMER_MS / 60_000);

type TimerDurationWheelProps = {
  minutes: number;
  onMinutesChange: (minutes: number) => void;
  onStart: () => void;
  loading: boolean;
};

/**
 * Sets how many minutes a timer runs on a single brushed-metal drum. Drag it
 * left or right, or tap either side of the window, to turn it. Seconds and
 * hours are not on the drum on purpose: those go through the custom editor
 * below, so this control stays a one-handed flick.
 */
export function TimerDurationWheel({ minutes, onMinutesChange, onStart, loading }: TimerDurationWheelProps) {
  const player = useAudioPlayer(require('../../../../assets/sounds/timer_tick.wav'));

  const rock = useSharedValue(0);
  const leftover = useSharedValue(0);
  const lastTranslationX = useSharedValue(0);
  const faceWidth = useSharedValue(0);

  const value = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, Math.round(minutes)));

  // A flick fires several notches before React re-renders, so the running
  // value lives here: reading it from props would turn the drum by one and
  // drop the rest.
  const liveMinutes = useSharedValue(value);
  useEffect(() => {
    liveMinutes.set(value);
  }, [value, liveMinutes]);

  const playTick = useCallback(() => {
    void player
      .seekTo(0)
      .then(() => player.play())
      .catch((error: unknown) => console.warn('Timer wheel tick could not be played.', error));
  }, [player]);

  const step = useCallback(
    (steps: number) => {
      if (steps === 0) return;

      const current = liveMinutes.get();
      const next = Math.min(MAX_MINUTES, Math.max(MIN_MINUTES, current + steps));
      const turned = Math.abs(next - current);
      if (turned === 0) return;

      liveMinutes.set(next);
      onMinutesChange(next);
      void Haptics.selectionAsync().catch(() => {});
      for (let index = 0; index < Math.min(MAX_TICKS_PER_UPDATE, turned); index += 1) playTick();
    },
    [liveMinutes, onMinutesChange, playTick],
  );

  // Only the web wheel listener needs this; the gestures below are rebuilt on
  // every render, so they can call `step` straight.
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let wheelDelta = 0;

    const handleWheel = (event: WheelEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || !target.closest('#timer-duration-wheel')) return;

      event.preventDefault();
      const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 800 : 1;
      wheelDelta += event.deltaY * deltaScale;
      const steps = Math.trunc(wheelDelta / 100);
      if (steps !== 0) {
        wheelDelta -= steps * 100;
        stepRef.current(-steps);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // Dragging right turns the drum up, so the next minute rolls in from the
  // right and the strip slides left under your finger.
  const panGesture = Gesture.Pan()
    .activeOffsetX([-5, 5])
    .onBegin(() => {
      leftover.set(0);
      lastTranslationX.set(0);
    })
    .onStart((event) => {
      leftover.set(event.translationX);
      lastTranslationX.set(event.translationX);
      const steps = Math.trunc(event.translationX / DRAG_PIXELS_PER_NOTCH);
      if (steps !== 0) {
        leftover.set(event.translationX - steps * DRAG_PIXELS_PER_NOTCH);
        scheduleOnRN(step, steps);
      }
      rock.set(leftover.get() * -ROCK_FACTOR);
    })
    .onUpdate((event) => {
      const movement = event.translationX - lastTranslationX.get();
      lastTranslationX.set(event.translationX);
      leftover.set(leftover.get() + movement);

      const steps = Math.trunc(leftover.get() / DRAG_PIXELS_PER_NOTCH);
      if (steps !== 0) {
        leftover.set(leftover.get() - steps * DRAG_PIXELS_PER_NOTCH);
        scheduleOnRN(step, steps);
      }
      rock.set(leftover.get() * -ROCK_FACTOR);
    })
    .onEnd(() => {
      leftover.set(0);
      lastTranslationX.set(0);
      rock.set(withSpring(0, { damping: 16, stiffness: 240 }));
    });

  // Tapping a number you can see picks it: the one on the right is larger.
  const tapGesture = Gesture.Tap()
    .maxDistance(10)
    .onEnd((event, success) => {
      if (success) scheduleOnRN(step, event.x < faceWidth.get() / 2 ? -1 : 1);
    });

  const animatedRoll = useAnimatedStyle(() => ({ transform: [{ translateX: rock.get() }] }));

  const ridges = useMemo(
    () =>
      Array.from({ length: RIDGE_COUNT }, (_, index) => (
        <View
          key={index}
          style={[
            styles.ridge,
            index % 2 === 0
              ? { backgroundColor: WheelColors.ridgeLight, borderLeftColor: WheelColors.ridgeLightTop, borderRightColor: WheelColors.ridgeLightBottom }
              : { backgroundColor: WheelColors.ridgeDark, borderLeftColor: WheelColors.ridgeDarkTop, borderRightColor: WheelColors.ridgeDarkBottom },
          ]}
        />
      )),
    [],
  );

  const selectedLabel = formatDurationLabel(value * 60_000);

  return (
    <View style={styles.selector}>
      <View style={styles.selectorHeader}>
        <ThemedText
          type="caption"
          themeColor="textSecondary"
          style={styles.summary}
          accessibilityLiveRegion="polite">
          Rings in {selectedLabel}
        </ThemedText>
        <Button
          label="Start timer"
          accessibilityLabel={`Start timer for ${selectedLabel}`}
          onPress={onStart}
          loading={loading}
          style={styles.startButton}
        />
      </View>

      <View style={[styles.housing, Elevation.medium]}>
        <View pointerEvents="none" style={styles.housingHighlight} />

        <GestureDetector gesture={Gesture.Race(panGesture, tapGesture)}>
          <View
            nativeID="timer-duration-wheel"
            onLayout={(event) => faceWidth.set(event.nativeEvent.layout.width)}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel="Timer minutes"
            accessibilityHint="Drag left or right, or tap either side of the number, to change it."
            accessibilityValue={{ min: MIN_MINUTES, max: MAX_MINUTES, now: value, text: selectedLabel }}
            accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
            onAccessibilityAction={(event) => step(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
            style={styles.drum}>
            <View style={styles.drumFace}>
              <Animated.View style={[styles.rail, styles.railTop, animatedRoll]}>{ridges}</Animated.View>
              <Animated.View style={[styles.rail, styles.railBottom, animatedRoll]}>{ridges}</Animated.View>

              <Animated.View style={[styles.strip, animatedRoll]}>
                {SLOTS.map((slot) => {
                  const candidate = value + slot;
                  const inRange = candidate >= MIN_MINUTES && candidate <= MAX_MINUTES;
                  return (
                    <View key={slot} style={styles.slot}>
                      <ThemedText
                        type="defaultBold"
                        style={[styles.digit, { color: slot === 0 ? WheelColors.digit : WheelColors.digitDim }]}>
                        {inRange ? String(candidate).padStart(2, '0') : ''}
                      </ThemedText>
                    </View>
                  );
                })}
              </Animated.View>

              <View pointerEvents="none" style={[styles.edgeShade, styles.edgeLeft]} />
              <View pointerEvents="none" style={[styles.edgeShade, styles.edgeRight]} />
              <View pointerEvents="none" style={styles.windowMark} />
              <View pointerEvents="none" style={styles.faceHighlight} />
              <View pointerEvents="none" style={styles.faceShade} />
            </View>
          </View>
        </GestureDetector>

        <ThemedText type="caption" style={styles.unitLabel}>
          minutes
        </ThemedText>

        <View pointerEvents="none" style={styles.housingBottomEdge} />
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
  summary: { flex: 1 },
  startButton: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.two,
  },

  housing: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    gap: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderTopColor: WheelColors.housingTop,
    borderLeftColor: WheelColors.housingLeft,
    borderRightColor: WheelColors.housingRight,
    borderBottomColor: WheelColors.housingBottom,
    borderRadius: Radius.medium,
    backgroundColor: WheelColors.housing,
  },
  housingHighlight: {
    position: 'absolute',
    top: 2,
    left: 8,
    right: 8,
    height: 1,
    backgroundColor: WheelColors.gloss,
  },
  housingBottomEdge: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 2,
    height: 1,
    backgroundColor: WheelColors.shadeStrong,
  },
  unitLabel: { fontSize: 11, textAlign: 'center', color: WheelColors.digitDim },

  drum: {
    width: '100%',
    cursor: 'ew-resize',
    touchAction: 'pan-y',
    userSelect: 'none',
  },
  drumFace: {
    height: FACE_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopColor: WheelColors.faceTop,
    borderLeftColor: WheelColors.faceLeft,
    borderRightColor: WheelColors.faceRight,
    borderBottomColor: WheelColors.faceBottom,
    borderRadius: Radius.small,
    backgroundColor: WheelColors.face,
  },

  // Numbers ride the middle of the drum, between the two grip bands.
  strip: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: RAIL_HEIGHT,
    height: FACE_HEIGHT - RAIL_HEIGHT * 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slot: { width: ITEM_WIDTH, alignItems: 'center', justifyContent: 'center' },
  digit: { fontSize: 22, lineHeight: FACE_HEIGHT - RAIL_HEIGHT * 2, fontVariant: ['tabular-nums'] },

  rail: {
    position: 'absolute',
    left: -RAIL_OVERSHOOT,
    right: -RAIL_OVERSHOOT,
    height: RAIL_HEIGHT,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  railTop: { top: 0 },
  railBottom: { bottom: 0 },
  ridge: {
    width: 3,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderRadius: 1,
    marginHorizontal: 1,
  },

  edgeShade: { position: 'absolute', top: 0, bottom: 0, width: EDGE_SHADE, backgroundColor: WheelColors.shade },
  edgeLeft: { left: 0 },
  edgeRight: { right: 0 },

  // Frames the minute that is actually selected.
  windowMark: {
    position: 'absolute',
    top: RAIL_HEIGHT,
    bottom: RAIL_HEIGHT,
    left: '50%',
    width: ITEM_WIDTH,
    marginLeft: -ITEM_WIDTH / 2,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: WheelColors.shadeStrong,
    borderRightColor: WheelColors.glossSoft,
  },

  faceHighlight: { position: 'absolute', top: 0, left: 2, right: 2, height: 4, backgroundColor: WheelColors.glossSoft },
  faceShade: { position: 'absolute', bottom: 0, left: 2, right: 2, height: 4, backgroundColor: WheelColors.shade },
});
