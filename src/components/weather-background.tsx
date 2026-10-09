import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';

import type { WeatherConditionType } from '@/utils/weather';
import { getWeatherBackgroundImageUrl } from '@/constants/weather-images';

interface WeatherBackgroundProps {
  conditionType: WeatherConditionType;
}

export function WeatherBackground({ conditionType }: WeatherBackgroundProps) {
  const imageUrl = getWeatherBackgroundImageUrl(conditionType);

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={400}
      />
      {/* Semi-transparent dark overlay to ensure text readability */}
      <View style={styles.darkOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
  },
});
