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

import { useTheme } from '@/hooks/use-theme';
import { Brand } from '@/constants/theme';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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

  const handleShareCard = async (quote: { quote: string; author: string }) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                background: #00109D;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                padding: 20px;
              }
              .card-wrapper {
                position: relative;
                width: 100%;
                max-width: 480px;
                margin: auto;
              }
              .floating-badge {
                position: absolute;
                top: -22px;
                left: 20px;
                width: 52px;
                height: 52px;
                background: #0152F5;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 10px 25px rgba(1, 82, 245, 0.4);
                z-index: 10;
                font-size: 32px;
                color: #FFFFFF;
                font-weight: bold;
              }
              .white-card {
                background: #FFFFFF;
                border-radius: 24px;
                padding: 44px 28px 24px 28px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.4);
              }
              .quote-text {
                font-size: 22px;
                line-height: 1.45;
                color: #111827;
                font-weight: 700;
                margin-bottom: 24px;
                font-style: italic;
              }
              .author-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid #E5E7EB;
                padding-top: 14px;
              }
              .author-info h4 {
                margin: 0;
                font-size: 13px;
                color: #111827;
                font-weight: 800;
                letter-spacing: 0.5px;
              }
              .author-info p {
                margin: 3px 0 0 0;
                font-size: 11px;
                color: #6B7280;
                font-weight: 600;
              }
              .footer-branding {
                margin-top: 16px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                color: #9CA3AF;
                font-size: 11px;
                font-weight: 800;
                letter-spacing: 1.5px;
                padding: 0 4px;
              }
            </style>
          </head>
          <body>
            <div class="card-wrapper">
              <div class="floating-badge">“</div>
              <div class="white-card">
                <div class="quote-text">“${quote.quote}”</div>
                <div class="author-row">
                  <div class="author-info">
                    <h4>${quote.author.toUpperCase()}</h4>
                    <p>Daily Financial Wisdom</p>
                  </div>
                </div>
              </div>
              <div class="footer-branding">
                <span>CASHTRACK</span>
                <span>NASDIGITAL.UK</span>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Wisdom Card' });
        return;
      }
    } catch {
      await Share.share({
        message: `“${quote.quote}”\n— ${quote.author}\n\n💡 Daily Financial Wisdom via CashTrack\nhttps://nasdigital.uk`,
        title: 'CashTrack Wisdom Card',
      });
    }
  };

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
          accessibilityRole="button"
          accessibilityLabel={`Profile overview for ${profile.name || 'User'}`}
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
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => router.push('/weather')}
          accessibilityRole="button"
          accessibilityLabel={`Weather forecast for ${weather.locationName}`}
          style={styles.slideCard}>
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
        </TouchableOpacity>

        {/* SLIDE 3: DAILY WISDOM QUOTE CARD (Reference Style) */}
        <View style={[styles.slideCard, styles.quoteCardContainer]}>
          <View pointerEvents="none" style={styles.quoteBgGlow1} />
          <View pointerEvents="none" style={styles.quoteBgGlow2} />

          {/* Floating Lime-Green Quote Badge overlapping top-left */}
          <View style={styles.floatingQuoteBadge}>
            <Text style={styles.floatingQuoteSymbol}>“</Text>
          </View>

          <View style={styles.quoteCardWrapper}>
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
  quoteCardContainer: {
    backgroundColor: Brand.deep,
    overflow: 'visible',
    height: 255,
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
    top: 37,
    left: 28,
    width: 44,
    height: 44,
    borderRadius: 22,
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
    fontSize: 28,
    fontWeight: '900',
    marginTop: 5,
  },
  quoteCardWrapper: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    justifyContent: 'space-between',
  },
  quoteCardContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  referenceQuoteText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 10,
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
    bottom: 12,
    left: 0,
    right: 0,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
