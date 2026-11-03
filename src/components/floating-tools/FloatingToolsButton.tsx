import { useCallback, useEffect, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { router, usePathname } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';
import { ToolsMenuModal } from './ToolsMenuModal';
import { Palette } from '@/constants/theme';

const BUTTON_SIZE = 48;
const RUNNING_WIDTH = 104;
const EDGE_GAP = 16;
/** Matches the tab bar in (tabs)/_layout.tsx: 62 plus the bottom inset (at least 10). */
const TAB_BAR_BASE = 62;
const POSITION_KEY = '@cashtrack_floating_tools_position';
const SPRING = { damping: 18, stiffness: 220, mass: 0.8 } as const;

type Side = 'left' | 'right';
type SavedPosition = { side: Side; y: number };

export function FloatingToolsButton() {
  return <FloatingToolsButtonInner />;
}

function FloatingToolsButtonInner() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { seconds, isRunning } = useStopwatch();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [side, setSide] = useState<Side>('right');
  const [savedY, setSavedY] = useState<number | null>(null);

  const currentWidth = isRunning ? RUNNING_WIDTH : BUTTON_SIZE;
  const currentHeight = BUTTON_SIZE;

  const minY = insets.top + EDGE_GAP;
  const maxY = Math.max(minY, height - insets.bottom - currentHeight - EDGE_GAP);
  const defaultY = height - Math.max(insets.bottom, 10) - TAB_BAR_BASE - currentHeight - EDGE_GAP;
  const targetY = Math.min(Math.max(savedY ?? defaultY, minY), maxY);
  const targetX = side === 'left' ? EDGE_GAP : Math.max(EDGE_GAP, width - currentWidth - EDGE_GAP);

  const translateX = useSharedValue<number>(targetX);
  const translateY = useSharedValue<number>(targetY);
  const contextX = useSharedValue<number>(0);
  const contextY = useSharedValue<number>(0);

  // Restore the last position the user dragged the button to.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(POSITION_KEY)
      .then((raw) => {
        if (!active || !raw) return;
        const parsed = JSON.parse(raw) as Partial<SavedPosition>;
        if (parsed.side === 'left' || parsed.side === 'right') setSide(parsed.side);
        if (typeof parsed.y === 'number' && Number.isFinite(parsed.y)) setSavedY(parsed.y);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Keep the button on its edge when the screen rotates, resizes, or the stopwatch pill grows.
  useEffect(() => {
    translateX.set(withSpring(targetX, SPRING));
    translateY.set(withSpring(targetY, SPRING));
  }, [targetX, targetY, translateX, translateY]);

  // Never cover the keyboard or the field being typed in.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const persistPosition = useCallback((nextSide: Side, nextY: number) => {
    setSide(nextSide);
    setSavedY(nextY);
    AsyncStorage.setItem(POSITION_KEY, JSON.stringify({ side: nextSide, y: nextY })).catch(() => {});
  }, []);

  const panGesture = Gesture.Pan()
    .minDistance(6)
    .onStart(() => {
      contextX.set(translateX.get());
      contextY.set(translateY.get());
    })
    .onUpdate((event) => {
      translateX.set(Math.min(Math.max(contextX.get() + event.translationX, EDGE_GAP), width - currentWidth - EDGE_GAP));
      translateY.set(Math.min(Math.max(contextY.get() + event.translationY, minY), maxY));
    })
    .onEnd(() => {
      const nextSide: Side = translateX.get() + currentWidth / 2 < width / 2 ? 'left' : 'right';
      const snapX = nextSide === 'left' ? EDGE_GAP : width - currentWidth - EDGE_GAP;
      const snapY = Math.min(Math.max(translateY.get(), minY), maxY);
      translateX.set(withSpring(snapX, SPRING));
      translateY.set(withSpring(snapY, SPRING));
      scheduleOnRN(persistPosition, nextSide, snapY);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.get() }, { translateY: translateY.get() }],
  }));

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}:${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(remMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isRunning) {
      router.push('/stopwatch' as any);
    } else {
      setIsInteracting(true);
      setModalVisible(true);
    }
  };

  const pathname = usePathname();
  const hideButton = !isRunning && (
    pathname === '/todo' ||
    pathname === '/calculator' ||
    pathname === '/currency' ||
    pathname === '/stopwatch' ||
    pathname === '/world-clock' ||
    pathname.startsWith('/notes') ||
    pathname === '/app-lock'
  );

  if (hideButton || keyboardVisible) {
    return (
      <ToolsMenuModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setIsInteracting(false);
        }}
      />
    );
  }

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.floatingContainer, animatedStyle]}>
          <Pressable
            onPressIn={() => setIsInteracting(true)}
            onPressOut={() => {
              if (!modalVisible) setIsInteracting(false);
            }}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={isRunning ? `Stopwatch running, ${formatTime(seconds)}. Open stopwatch.` : 'Open quick tools'}
            accessibilityHint="Drag to move the button"
            style={({ pressed }) => [
              styles.button,
              isRunning && styles.runningPill,
              {
                backgroundColor: isRunning ? theme.card : theme.accentFill,
                borderColor: isRunning ? theme.accent : 'transparent',
                opacity: isInteracting || pressed || isRunning || modalVisible ? 1 : 0.85,
                shadowColor: '#000000',
              },
              pressed && { transform: [{ scale: 0.93 }] },
            ]}>
            {isRunning ? (
              <>
                <View style={[styles.liveDot, { backgroundColor: theme.accent }]} />
                <ThemedText type="smallBold" style={[styles.pillText, { color: theme.text }]}>
                  {formatTime(seconds)}
                </ThemedText>
                <Ionicons name="timer-outline" size={14} color={theme.accent} />
              </>
            ) : (
              <Ionicons name="grid" size={22} color={Palette.white} />
            )}
          </Pressable>
        </Animated.View>
      </GestureDetector>

      <ToolsMenuModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setIsInteracting(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    zIndex: 9999,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  runningPill: {
    width: RUNNING_WIDTH,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    flexDirection: 'row',
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    borderWidth: 1.5,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillText: {
    fontVariant: ['tabular-nums'],
    fontSize: 12,
  },
});
