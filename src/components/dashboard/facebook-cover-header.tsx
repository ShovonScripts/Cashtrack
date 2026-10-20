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
  Share,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/use-theme';
import { Brand } from '@/constants/theme';
import { useExpenses } from '@/context/expense-context';
import type { UserProfile } from '@/types/preferences';
import { getCoverSource } from '@/constants/cover-presets';
import { getQuoteOfTheDay } from '@/constants/quotes';
import { fetchLiveWeatherData, DEFAULT_WEATHER_DATA, type WeatherData } from '@/utils/weather';
import { AnimatedWeather } from '@/components/animated-weather';
import { WeatherBackground } from '@/components/weather-background';
import { DualClockWidget } from '@/components/dashboard/DualClockWidget';

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
  const insets = useSafeAreaInsets();
  const { temperatureUnit, formatAmount } = useExpenses();
  const [activeIndex, setActiveIndex] = useState(0);

  // Live weather state
  const [weather, setWeather] = useState<WeatherData>(DEFAULT_WEATHER_DATA);

  const handleShareCard = async (quote: { quote: string; author: string }) => {
    try {
      await Share.share({
        message: `“${quote.quote}”\n— ${quote.author.toUpperCase()}\n\n💡 Daily Financial Wisdom via CashTrack\nhttps://nasdigital.uk`,
        title: 'CashTrack Wisdom Card',
      });
    } catch (error) {
      console.error('Error sharing quote:', error);
    }
  };

  const scrollViewRef = useRef<ScrollView>(null);

  // Auto slide every 10 seconds (3 slides)
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

  const topPadding = Math.max(insets.top + 12, 40);

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
        {/* SLIDE 1: COVER PHOTO + PROFILE & NET BALANCE */}
        <View style={styles.slideCard}>
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={[styles.cardInnerCombined, { paddingTop: topPadding }]}>
            {/* Profile & Greeting on Bottom */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onPressProfile || (() => router.push('/profile'))}
              accessibilityRole="button"
              accessibilityLabel={`Profile overview for ${profile.name || 'User'}`}
              style={styles.facebookBottomRow}
            >
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
            </TouchableOpacity>
          </View>
        </View>

        {/* SLIDE 2: LIVE WEATHER + WORLD CLOCKS */}
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            router.push('/weather');
          }}
          accessibilityRole="button"
          accessibilityLabel={`Weather for ${weather.locationName}, ${displayTemp}, ${weather.condition}. World clocks. Opens Weather and Insights.`}
          style={styles.slideCard}>
          <WeatherBackground conditionType={weather.conditionType} />

          <View style={[styles.cardInner, { paddingTop: topPadding }]}>
            <View style={styles.topRowBadge}>
              <View style={styles.outlookPill}>
                <Ionicons name="location" size={13} color="#38bdf8" />
                <Text style={styles.outlookText} numberOfLines={1}>{weather.locationName}</Text>
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

            <View style={styles.weatherClockRow}>
              <View style={styles.weatherMainColumn}>
                <View style={styles.weatherIconTempRow}>
                  <AnimatedWeather conditionType={weather.conditionType} size={40} />
                  <Text style={styles.giantTempCompact}>{displayTemp}</Text>
                </View>
                <Text style={styles.whiteSubtext} numberOfLines={1}>{weather.condition}</Text>
                <View style={styles.highLowBox}>
                  <Text style={styles.highText}>H: {displayHigh}</Text>
                  <Text style={styles.lowText}>L: {displayLow}</Text>
                </View>
              </View>

              <View style={styles.clockDivider} />

              <View style={styles.clockColumn}>
                <DualClockWidget variant="compact" readOnly />
              </View>
            </View>

            <View style={styles.slideHint}>
              <Text style={styles.slideHintText}>Tap for details</Text>
              <Ionicons name="chevron-forward" size={13} color="rgba(255,255,255,0.8)" />
            </View>
          </View>
        </TouchableOpacity>

        {/* SLIDE 3: DAILY WISDOM QUOTE CARD (Reference Style) */}
        <View style={[styles.slideCard, styles.quoteCardContainer]}>
          <View pointerEvents="none" style={styles.quoteBgGlow1} />
          <View pointerEvents="none" style={styles.quoteBgGlow2} />

          {/* Floating Lime-Green Quote Badge overlapping top-left */}
          <View style={[styles.floatingQuoteBadge, { top: topPadding - 8 }]}>
            <Text style={styles.floatingQuoteSymbol}>“</Text>
          </View>

          <View style={[styles.quoteCardWrapper, { paddingTop: topPadding + 14 }]}>
            <View style={styles.quoteCardContent}>
              <Text style={styles.referenceQuoteText} numberOfLines={3} adjustsFontSizeToFit>
                &ldquo;{currentQuote.quote}&rdquo;
              </Text>

              <View style={styles.referenceAuthorRow}>
                <View style={styles.referenceAuthorInfo}>
                  <Text style={styles.referenceAuthorName}>{currentQuote.author.toUpperCase()}</Text>
                  <Text style={styles.referenceAuthorTitle}>Daily Financial Wisdom</Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    void handleShareCard(currentQuote);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Share quote card"
                  style={styles.shareCardButton}>
                  <MaterialCommunityIcons name="share-variant" size={15} color="#111827" />
                  <Text style={styles.shareCardButtonText}>Share</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.quoteCardFooterBranding}>
              <Text style={styles.footerBrandText}>CASHTRACK</Text>
              <Text style={styles.footerBrandUrl}>NASDIGITAL.UK</Text>
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
    minHeight: 300,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
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
    paddingHorizontal: 18,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  cardInnerCombined: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
    justifyContent: 'flex-end',
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
    gap: 12,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  profileTextInfo: {
    flex: 1,
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    lineHeight: 22,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  netBalanceText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  outlookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '60%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
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
  weatherClockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  weatherMainColumn: {
    flex: 1.15,
    gap: 4,
  },
  weatherIconTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giantTempCompact: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  clockDivider: {
    width: StyleSheet.hairlineWidth,
    height: 88,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  clockColumn: {
    flex: 1,
  },
  highLowBox: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 1,
  },
  highText: {
    color: '#4ade80',
    fontSize: 12.5,
    fontWeight: '700',
  },
  lowText: {
    color: '#38bdf8',
    fontSize: 12.5,
    fontWeight: '700',
  },
  slideHint: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 3,
  },
  slideHintText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quoteCardContainer: {
    backgroundColor: Brand.deep,
    overflow: 'visible',
  },
  quoteBgGlow1: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    right: -90,
    top: -100,
    backgroundColor: 'rgba(139, 123, 255, 0.25)',
  },
  quoteBgGlow2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    left: -50,
    bottom: -60,
    backgroundColor: 'rgba(20, 231, 253, 0.2)',
  },
  floatingQuoteBadge: {
    position: 'absolute',
    left: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0152F5',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    shadowColor: '#0152F5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingQuoteSymbol: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    marginTop: 4,
  },
  quoteCardWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  quoteCardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 24,
    paddingBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  referenceQuoteText: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 8,
  },
  referenceAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 8,
  },
  referenceAuthorInfo: {
    flex: 1,
  },
  referenceAuthorName: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  referenceAuthorTitle: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  shareCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  shareCardButtonText: {
    color: '#111827',
    fontSize: 11,
    fontWeight: '700',
  },
  quoteCardFooterBranding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  footerBrandText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  footerBrandUrl: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
