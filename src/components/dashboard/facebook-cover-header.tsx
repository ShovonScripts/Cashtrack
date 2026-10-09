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

interface FacebookCoverHeaderProps {
  profile: UserProfile;
  totalBalance?: number;
  monthlySpent?: number;
  onPressProfile?: () => void;
}

export function FacebookCoverHeader({
  profile,
  totalBalance = 0,
  monthlySpent = 0,
  onPressProfile,
}: FacebookCoverHeaderProps) {
  const theme = useTheme();
  const { temperatureUnit, formatAmount } = useExpenses();
  const [activeIndex, setActiveIndex] = useState(0);

  // Live weather state
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER_DATA);

  const scrollViewRef = useRef<ScrollView>(null);

  // Auto slide every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % 3;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  useEffect(() => {
    async function loadWeather() {
      const data = await fetchLiveWeatherData();
      setWeather(data);
    }
    void loadWeather();
  }, []);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
    if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex <= 2) {
      setActiveIndex(currentIndex);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const currentQuote = getQuoteOfTheDay();

  // Convert temperatures based on user preference
  const formatTemp = (tempC: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const displayTemp = formatTemp(weather.tempC);
  const displayHigh = formatTemp(weather.tempMaxC);
  const displayLow = formatTemp(weather.tempMinC);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayStr = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date());

  return (
    <View style={styles.container}>
      {/* FULL-WIDTH EDGE-TO-EDGE FACEBOOK MOBILE COVER CAROUSEL */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SLIDE 1: GREETING, DATE & WEALTH OVERVIEW */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPressProfile || (() => router.push('/profile'))}
          style={styles.slideCard}
        >
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            {/* Top row status pushed down below status bar */}
            <View style={styles.topRowBadge}>
              <View style={styles.liveBadge}>
                <Ionicons name="sparkles" size={12} color="#4ade80" />
                <Text style={styles.badgeText}>Live Dashboard</Text>
              </View>
            </View>

            {/* Facebook Mobile Profile Layout */}
            <View style={styles.facebookBottomRow}>
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

              <View style={styles.profileTextInfo}>
                <Text style={styles.whiteSubtext}>{todayStr}</Text>
                <Text style={styles.whiteTitle} numberOfLines={1}>
                  {getGreeting()}, {profile.name ? profile.name.split(/\s+/)[0] : 'User'}
                </Text>
                <Text style={styles.netBalanceText}>
                  Net Balance: <Text style={{ color: '#4ade80', fontWeight: '700' }}>{formatAmount(totalBalance)}</Text>
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* SLIDE 2: ADVANCED ANIMATED WEATHER FORECAST */}
        <View style={styles.slideCard}>
          <WeatherBackground conditionType={weather.conditionType} />

          <View style={styles.cardInner}>
            <View style={styles.topRowBadge}>
              <View style={styles.outlookPill}>
                <Ionicons name="location" size={13} color="#38bdf8" />
                <Text style={styles.outlookText}>{weather.locationName}</Text>
              </View>

              {/* Extra Forecast Pills */}
              <View style={styles.metricsRow}>
                <View style={styles.metricPill}>
                  <Ionicons name="umbrella" size={12} color="#60a5fa" />
                  <Text style={styles.metricText}>{weather.rainProbability}%</Text>
                </View>
                <View style={styles.metricPill}>
                  <Ionicons name="water" size={12} color="#38bdf8" />
                  <Text style={styles.metricText}>{weather.humidity}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.weatherCenterRow}>
              <AnimatedWeather conditionType={weather.conditionType} size={42} />
              <View style={styles.weatherTextColumn}>
                <View style={styles.tempAndLimitsRow}>
                  <Text style={styles.giantTemp}>{displayTemp}</Text>
                  <View style={styles.highLowBox}>
                    <Text style={styles.highText}>H: {displayHigh}</Text>
                    <Text style={styles.lowText}>L: {displayLow}</Text>
                  </View>
                </View>
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
        <View style={styles.slideCard}>
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            <View style={styles.topRowBadge}>
              <View style={styles.wisdomPill}>
                <Ionicons name="ribbon" size={14} color="#c084fc" />
                <Text style={styles.wisdomText}>Daily Wisdom</Text>
              </View>
            </View>

            <View style={styles.quoteBody}>
              <Text style={styles.quoteBodyText}>&ldquo;{currentQuote.quote}&rdquo;</Text>
              <Text style={styles.quoteAuthorText}>— {currentQuote.author}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Pagination Dots */}
      <View style={styles.paginationContainer}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  activeIndex === index
                    ? '#FFFFFF'
                    : 'rgba(255,255,255,0.4)',
                width: activeIndex === index ? 22 : 6,
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
    width: SCREEN_WIDTH,
    marginBottom: 16,
  },
  scrollContent: {
    // Edge to edge cover
  },
  slideCard: {
    width: SCREEN_WIDTH,
    height: 250,
    position: 'relative',
    overflow: 'hidden',
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
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 22,
    justifyContent: 'space-between',
  },
  topRowBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  facebookBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2.5,
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
    fontSize: 26,
    fontWeight: '700',
  },
  profileTextInfo: {
    flex: 1,
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    fontWeight: '500',
  },
  netBalanceText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 2,
  },
  outlookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metricText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  weatherCenterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 6,
  },
  weatherTextColumn: {
    flex: 1,
  },
  tempAndLimitsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  giantTemp: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  highLowBox: {
    flexDirection: 'row',
    gap: 8,
  },
  highText: {
    color: '#4ade80',
    fontSize: 13,
    fontWeight: '700',
  },
  lowText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
  glassTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tipContentText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '500',
    flex: 1,
    lineHeight: 16,
  },
  wisdomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  wisdomText: {
    color: '#c084fc',
    fontSize: 13,
    fontWeight: '600',
  },
  quoteBody: {
    paddingVertical: 8,
  },
  quoteBodyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 22,
  },
  quoteAuthorText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
