import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import type { WeatherConditionType } from '@/utils/weather';

interface AnimatedWeatherProps {
  conditionType: WeatherConditionType;
  size?: number;
}

export function AnimatedWeather({ conditionType, size = 48 }: AnimatedWeatherProps) {
  // Shared values for various weather effects
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(1);
  const cloudOffset = useSharedValue(0);
  const rainOffset = useSharedValue(0);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    // Sun rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );

    // Pulse glow
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating clouds
    cloudOffset.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 2500, easing: Easing.inOut(Easing.quad) }),
        withTiming(-6, { duration: 2500, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Rain drop translation
    rainOffset.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.linear }),
      -1,
      false
    );

    // Lightning flash for thunderstorm
    if (conditionType === 'thunderstorm') {
      flashOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 2000 }),
          withTiming(0.8, { duration: 100 }),
          withTiming(0, { duration: 150 }),
          withTiming(0.6, { duration: 80 }),
          withTiming(0, { duration: 1000 })
        ),
        -1,
        false
      );
    }
  }, [conditionType, cloudOffset, flashOpacity, pulse, rainOffset, rotation]);

  const sunAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: `${rotation.value}deg` },
        { scale: pulse.value },
      ],
    };
  });

  const cloudAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: cloudOffset.value }],
    };
  });

  const rainDrop1Style = useAnimatedStyle(() => {
    const translateY = interpolate(rainOffset.value, [0, 1], [-4, 12]);
    const opacity = interpolate(rainOffset.value, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    return {
      transform: [{ translateY }, { translateX: -6 }],
      opacity,
    };
  });

  const rainDrop2Style = useAnimatedStyle(() => {
    const progress = (rainOffset.value + 0.5) % 1;
    const translateY = interpolate(progress, [0, 1], [-4, 12]);
    const opacity = interpolate(progress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
    return {
      transform: [{ translateY }, { translateX: 6 }],
      opacity,
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    return {
      opacity: flashOpacity.value,
    };
  });

  const iconSize = size;
  const containerStyle = { width: iconSize, height: iconSize };

  switch (conditionType) {
    case 'sunny':
      return (
        <View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.glowRing, { width: iconSize * 1.2, height: iconSize * 1.2, borderRadius: iconSize * 0.6 }, sunAnimatedStyle]} />
          <Ionicons name="sunny" size={iconSize} color="#F59E0B" />
        </View>
      );

    case 'clear-night':
      return (
        <View style={[styles.container, containerStyle]}>
          <Ionicons name="moon" size={iconSize} color="#E0E7FF" />
        </View>
      );

    case 'partly-sunny':
      return (
        <View style={[styles.container, containerStyle]}>
          <Ionicons name="sunny" size={iconSize * 0.75} color="#F59E0B" style={{ position: 'absolute', top: -2, right: -2 }} />
          <Animated.View style={cloudAnimatedStyle}>
            <Ionicons name="cloud" size={iconSize * 0.85} color="#94A3B8" />
          </Animated.View>
        </View>
      );

    case 'cloudy':
      return (
        <View style={[styles.container, containerStyle]}>
          <Animated.View style={cloudAnimatedStyle}>
            <Ionicons name="cloudy" size={iconSize} color="#94A3B8" />
          </Animated.View>
        </View>
      );

    case 'rainy':
      return (
        <View style={[styles.container, containerStyle]}>
          <Animated.View style={cloudAnimatedStyle}>
            <Ionicons name="rainy" size={iconSize} color="#3B82F6" />
          </Animated.View>
          <View style={styles.rainOverlay}>
            <Animated.View style={[styles.drop, rainDrop1Style]} />
            <Animated.View style={[styles.drop, rainDrop2Style]} />
          </View>
        </View>
      );

    case 'snow':
      return (
        <View style={[styles.container, containerStyle]}>
          <Animated.View style={cloudAnimatedStyle}>
            <Ionicons name="snow" size={iconSize} color="#38BDF8" />
          </Animated.View>
        </View>
      );

    case 'thunderstorm':
      return (
        <View style={[styles.container, containerStyle]}>
          <Animated.View style={[styles.flashOverlay, flashStyle]} />
          <Animated.View style={cloudAnimatedStyle}>
            <Ionicons name="thunderstorm" size={iconSize} color="#A855F7" />
          </Animated.View>
        </View>
      );

    default:
      return <Ionicons name="partly-sunny" size={iconSize} color="#F59E0B" />;
  }
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  rainOverlay: {
    position: 'absolute',
    bottom: -8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 20,
  },
  drop: {
    width: 2.5,
    height: 7,
    borderRadius: 1.5,
    backgroundColor: '#60A5FA',
  },
  flashOverlay: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
});
