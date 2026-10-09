import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import type { UserProfile } from '@/types/preferences';
import { getCoverSource } from '@/constants/cover-presets';
import { getQuoteOfTheDay } from '@/constants/quotes';
import { fetchLiveWeatherData, DEFAULT_WEATHER_DATA, type WeatherData } from '@/utils/weather';
import { AnimatedWeather } from '@/components/animated-weather';
import { WeatherBackground } from '@/components/weather-background';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

interface SlidingHeroBannerProps {
  profile: UserProfile;
  totalBalance?: number;
  monthlySpent?: number;
  onPressProfile?: () => void;
}

export function SlidingHeroBanner({
  profile,
  totalBalance = 0,
  monthlySpent = 0,
  onPressProfile,
}: SlidingHeroBannerProps) {
  const theme = useTheme();
  const { temperatureUnit, formatAmount } = useExpenses();
  const [activeIndex, setActiveIndex] = useState(0);
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER_DATA);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadWeather() {
      const data = await fetchLiveWeatherData();
      setWeather(data);
    }
    void loadWeather();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / BANNER_WIDTH);
    if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex <= 2) {
      setActiveIndex(currentIndex);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const currentQuote = getQuoteOfTheDay();

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const displayTemp = formatTemp(weather.tempC);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayStr = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + 16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SLIDE 1: GREETING, DATE & WEALTH OVERVIEW */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPressProfile || (() => router.push('/profile'))}
          style={[styles.card, { borderColor: theme.border }]}
        >
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            <View style={styles.slide1Header}>
              <View
                style={[
                  styles.avatarContainer,
                  { borderColor: '#FFFFFF', backgroundColor: theme.background },
                ]}
              >
                {profile.profilePhotoUri ? (
                  <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accent }]}>
                    <Text style={styles.avatarInitial}>
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.greetingBox}>
                <Text style={styles.whiteSubtext}>{todayStr}</Text>
                <Text style={styles.whiteTitle} numberOfLines={1}>
                  {getGreeting()}, {profile.name ? profile.name.split(/\s+/)[0] : 'User'}
                </Text>
              </View>
            </View>

            <View style={styles.glassFinBox}>
              <View style={styles.finItem}>
                <Text style={styles.glassFinLabel}>Net Balance</Text>
                <Text style={[styles.glassFinValue, { color: '#4ade80' }]}>{formatAmount(totalBalance)}</Text>
              </View>
              <View style={styles.finDivider} />
              <View style={styles.finItem}>
                <Text style={styles.glassFinLabel}>Spent This Month</Text>
                <Text style={[styles.glassFinValue, { color: '#f87171' }]}>{formatAmount(monthlySpent)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* SLIDE 2: ADVANCED ANIMATED WEATHER FORECAST */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <WeatherBackground conditionType={weather.conditionType} />

          <View style={styles.cardInner}>
            <View style={styles.slideHeader}>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={13} color="#FFFFFF" />
                <Text style={styles.whiteSubtext}>{weather.locationName}</Text>
              </View>
              <View style={styles.outlookPill}>
                <Ionicons name="umbrella" size={13} color="#38bdf8" />
                <Text style={styles.outlookText}>{weather.rainProbability}% Rain</Text>
              </View>
            </View>

            <View style={styles.weatherCenterRow}>
              <AnimatedWeather conditionType={weather.conditionType} size={36} />
              <View style={styles.weatherTextColumn}>
                <Text style={styles.giantTemp}>{displayTemp}</Text>
                <Text style={styles.whiteSubtext}>{weather.condition}</Text>
              </View>
            </View>

            <View style={styles.glassTipBox}>
              <Ionicons name="bulb" size={15} color="#facc15" />
              <Text style={styles.tipContentText} numberOfLines={2}>{weather.financialTip}</Text>
            </View>
          </View>
        </View>

        {/* SLIDE 3: DAILY MOTIVATION QUOTES */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            <View style={styles.slideHeader}>
              <View style={styles.wisdomPill}>
                <Ionicons name="ribbon" size={14} color="#c084fc" />
                <Text style={styles.wisdomText}>Daily Wisdom</Text>
              </View>
              <Ionicons name="chatbubble-outline" size={18} color="rgba(255,255,255,0.7)" />
            </View>

            <View style={styles.quoteBody}>
              <Text style={styles.quoteBodyText}>&ldquo;{currentQuote.quote}&rdquo;</Text>
              <Text style={styles.quoteAuthorText}>— {currentQuote.author}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Pagination Indicator Dots */}
      <View style={styles.paginationContainer}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeIndex === index
                    ? theme.accent
                    : theme.border,
                width: activeIndex === index ? 20 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  card: {
    width: BANNER_WIDTH,
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  fullCoverImage: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  cardInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  slide1Header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  greetingBox: {
    flex: 1,
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  glassFinBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  finItem: {
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  glassFinLabel: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
  },
  glassFinValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  slideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  outlookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  weatherCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginVertical: 2,
  },
  weatherTextColumn: {
    flex: 1,
  },
  giantTemp: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  glassTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tipContentText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  wisdomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  wisdomText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '600',
  },
  quoteBody: {
    paddingVertical: 4,
  },
  quoteBodyText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  quoteAuthorText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
