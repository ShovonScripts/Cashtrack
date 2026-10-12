import { useState } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useStopwatch } from '@/context/stopwatch-context';
import { ToolsMenuModal } from './ToolsMenuModal';

const BUTTON_SIZE = 44;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function FloatingToolsButton() {
  const theme = useTheme();
  const { seconds, isRunning } = useStopwatch();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isInteracting, setIsInteracting] = useState<boolean>(false);

  const translateX = useSharedValue<number>(SCREEN_WIDTH - (isRunning ? 110 : BUTTON_SIZE) - 20);
  const translateY = useSharedValue<number>(SCREEN_HEIGHT - BUTTON_SIZE - 100);

  const contextX = useSharedValue<number>(0);
  const contextY = useSharedValue<number>(0);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      const middle = SCREEN_WIDTH / 2;
      const currentWidth = isRunning ? 100 : BUTTON_SIZE;
      const targetX = translateX.value + currentWidth / 2 < middle ? 16 : SCREEN_WIDTH - currentWidth - 16;
      translateX.value = withSpring(targetX, { damping: 15 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
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
            style={({ pressed }) => [
              styles.button,
              isRunning && styles.runningPill,
              {
                backgroundColor: isRunning ? theme.card : theme.accent,
                borderColor: isRunning ? theme.accent : 'transparent',
                opacity: isInteracting || pressed || isRunning ? 1 : 0.4,
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
              <Ionicons name="grid" size={20} color="#FFFFFF" />
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
    width: 100,
    height: 38,
    borderRadius: 19,
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
