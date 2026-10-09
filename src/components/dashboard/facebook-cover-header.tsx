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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';

import { useTheme } from '@/hooks/use-theme';
import { useExpenses } from '@/context/expense-context';
import type { UserProfile } from '@/types/preferences';
import { getCoverSource } from '@/constants/cover-presets';
import { getQuoteOfTheDay } from '@/constants/quotes';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FacebookCoverHeaderProps {
  profile: UserProfile;
  totalBalance?: number;
  monthlySpent?: number;
  onPressProfile?: () => void;
}

function getWeatherCondition(code: number): { condition: string; icon: keyof typeof Ionicons.glyphMap } {
  if (code === 0) return { condition: 'Sunny & Clear', icon: 'sunny' };
  if (code >= 1 && code <= 3) return { condition: 'Partly Cloudy', icon: 'partly-sunny' };
  if (code >= 51 && code <= 67) return { condition: 'Rain Showers', icon: 'rainy' };
  if (code >= 71 && code <= 77) return { condition: 'Snowy', icon: 'snow' };
  if (code >= 95) return { condition: 'Thunderstorm', icon: 'thunderstorm' };
  return { condition: 'Pleasant Breeze', icon: 'cloudy' };
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
  const [tempC, setTempC] = useState<number>(22);
  const [weatherCode, setWeatherCode] = useState<number>(0);
  const [locationName, setLocationName] = useState<string>('Local Weather');
  const [weatherTip, setWeatherTip] = useState<string>('Great day to stay on budget and track your goals!');

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
    async function fetchLiveWeather() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = location.coords;

        // Fetch from free Open-Meteo API
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );
        const data = (await response.json()) as { current_weather?: { temperature: number; weathercode: number } };

        if (data.current_weather) {
          const currentTemp = data.current_weather.temperature;
          const code = data.current_weather.weathercode;
          setTempC(currentTemp);
          setWeatherCode(code);

          // Reverse geocode city name if possible
          let cityFound = false;
          if (Platform.OS !== 'web') {
            try {
              const reverseGeo = await Location.reverseGeocodeAsync({ latitude, longitude });
              if (reverseGeo && reverseGeo[0]) {
                const city = reverseGeo[0].city || reverseGeo[0].subregion || reverseGeo[0].region;
                if (city) {
                  setLocationName(city);
                  cityFound = true;
                }
              }
            } catch {
              // Ignore native reverse geocode failure
            }
          }

          if (!cityFound) {
            try {
              const geoRes = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const geoData = (await geoRes.json()) as { city?: string; locality?: string; principalSubdivision?: string };
              const city = geoData.city || geoData.locality || geoData.principalSubdivision;
              if (city) setLocationName(city);
            } catch {
              // Ignore fallback geocode failure
            }
          }

          if (currentTemp > 25) {
            setWeatherTip('Warm weather! Great day for an iced coffee walk instead of driving.');
          } else if (currentTemp < 10) {
            setWeatherTip('Chilly weather! Perfect time to brew coffee at home and save.');
          } else {
            setWeatherTip('Lovely weather today — stay mindful of your daily budget!');
          }
        }
      } catch {
        // Fallback gracefully on network error / offline
      }
    }

    void fetchLiveWeather();
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
  const weatherInfo = getWeatherCondition(weatherCode);

  // Convert temperature based on user preference (Fahrenheit vs Celsius)
  const displayTemp = temperatureUnit === 'F' ? Math.round((tempC * 9) / 5 + 32) : Math.round(tempC);
  const tempSymbol = temperatureUnit === 'F' ? '°F' : '°C';

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

        {/* SLIDE 2: LIVE WEATHER UPDATE */}
        <View style={styles.slideCard}>
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            <View style={styles.topRowBadge}>
              <View style={styles.outlookPill}>
                <Ionicons name={weatherInfo.icon} size={14} color="#38bdf8" />
                <Text style={styles.outlookText}>{locationName}</Text>
              </View>
            </View>

            <View style={styles.weatherCenter}>
              <Text style={styles.giantTemp}>{displayTemp}{tempSymbol}</Text>
              <Text style={styles.whiteSubtext}>{weatherInfo.condition}</Text>
            </View>

            <View style={styles.glassTipBox}>
              <Ionicons name="bulb" size={16} color="#facc15" />
              <Text style={styles.tipContentText}>{weatherTip}</Text>
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

      {/* Floating Pagination Dots positioned slightly lower */}
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
    // no horizontal padding so it goes edge-to-edge like Facebook mobile cover
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
  fullCoverPlaceholder: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  overlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(5, 5, 15, 0.55)',
  },
  cardInner: {
    flex: 1,
    padding: 20,
    paddingTop: 16,
    justifyContent: 'space-between',
  },
  topRowBadge: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 22,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  facebookBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 4,
  },
  avatarContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  profileTextInfo: {
    flex: 1,
    gap: 2,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  netBalanceText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  editProfileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  outlookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600',
  },
  weatherCenter: {
    marginVertical: 2,
  },
  giantTemp: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: 'bold',
  },
  glassTipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    gap: 10,
  },
  tipContentText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  wisdomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
  },
  wisdomText: {
    color: '#c084fc',
    fontSize: 12,
    fontWeight: '600',
  },
  quoteBody: {
    justifyContent: 'center',
    marginVertical: 4,
  },
  quoteBodyText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 6,
  },
  quoteAuthorText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 4, // Positioned even lower closer to the bottom edge
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
