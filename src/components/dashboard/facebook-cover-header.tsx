import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { Brand, Radius } from '@/constants/theme';
import { useExpenses, usePreferences } from '@/context/expense-context';
import type { UserProfile } from '@/types/preferences';
import { getCoverSource } from '@/constants/cover-presets';
import { getQuoteOfTheDay } from '@/constants/quotes';
import { fetchLiveWeatherData, DEFAULT_WEATHER_DATA, type WeatherData } from '@/utils/weather';
import { getYearProgress } from '@/utils/year-progress';
import { getMonthlySpendTotals } from '@/utils/monthly-spend';
import { AnimatedWeather } from '@/components/animated-weather';
import { WeatherBackground } from '@/components/weather-background';
import { DualClockWidget } from '@/components/dashboard/DualClockWidget';
import { YearProgressPanel } from '@/components/dashboard/year-progress-panel';

const HERO_HEIGHT = 320;
const H_PADDING = 24;
const SWIPE_HINT_KEY = '@cashtrack_cover_swipe_hint_seen';
const VERTICAL_SPRING = { damping: 24, stiffness: 200, mass: 0.9 } as const;
const SLIDE_LABELS = ['Cover', 'Weather', 'Daily wisdom'] as const;
const MONTH_SHORT = new Intl.DateTimeFormat('en', { month: 'short' });

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
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { expenses } = useExpenses();
  const { temperatureUnit, formatAmount, firstDayOfWeek } = usePreferences();
  const [activeIndex, setActiveIndex] = useState(0);
  const [verticalPage, setVerticalPage] = useState(0);
  const [autoSlideKey, setAutoSlideKey] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const reducedMotion = useReducedMotion();
  const now = useNow(60_000);
  const progress = getYearProgress(now, firstDayOfWeek);
  const monthlySpend = useMemo(
    () => getMonthlySpendTotals(expenses, progress.year),
    [expenses, progress.year]
  );

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
  const programmaticSlideRef = useRef<number | null>(null);
  const translateY = useSharedValue(0);
  const hintScale = useSharedValue(1);

  const resetAutoSlide = () => setAutoSlideKey((key) => key + 1);

  const applyVerticalPage = (next: 0 | 1) => {
    setVerticalPage(next);
    Haptics.selectionAsync().catch(() => {});
    resetAutoSlide();
    AccessibilityInfo.announceForAccessibility(
      next === 1 ? 'Year progress' : 'Greeting'
    );
    AsyncStorage.setItem(SWIPE_HINT_KEY, '1').catch(() => {});
    setShowSwipeHint(false);
  };

  const animateVerticalTo = (next: 0 | 1, onDone?: (finished?: boolean) => void) => {
    'worklet';
    const target = next === 1 ? -HERO_HEIGHT : 0;
    translateY.value = reducedMotion
      ? withTiming(target, { duration: 180 }, onDone)
      : withSpring(target, VERTICAL_SPRING, onDone);
  };

  const goToVerticalPage = (next: 0 | 1) => {
    if (next === verticalPage) return;
    applyVerticalPage(next);
    hintScale.value = 1;
    animateVerticalTo(next);
  };

  const verticalTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const coverImageStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: reducedMotion
          ? 1
          : interpolate(translateY.value, [-HERO_HEIGHT, 0], [1.06, 1], Extrapolation.CLAMP),
      },
    ],
  }));

  const pageAContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-HERO_HEIGHT * 0.6, 0], [0.2, 1], Extrapolation.CLAMP),
  }));

  const pageBContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [-HERO_HEIGHT, -HERO_HEIGHT * 0.4],
      [1, 0.2],
      Extrapolation.CLAMP
    ),
  }));

  const scrimBoostStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [-HERO_HEIGHT, 0], [0.22, 0], Extrapolation.CLAMP),
  }));

  const hintStyle = useAnimatedStyle(() => ({
    transform: [{ scale: hintScale.value }],
  }));

  // Auto slide every 10 seconds between the horizontal slides only.
  // It pauses while the year progress page is open so the panel is not yanked away.
  useEffect(() => {
    if (verticalPage === 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % 3;
      programmaticSlideRef.current = nextIndex;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * screenWidth,
        animated: true,
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [activeIndex, autoSlideKey, screenWidth, verticalPage]);

  useEffect(() => {
    async function loadWeather() {
      const data = await fetchLiveWeatherData();
      setWeather(data ?? DEFAULT_WEATHER_DATA);
    }
    void loadWeather();
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(SWIPE_HINT_KEY)
      .then((seen) => {
        if (seen) return;
        timer = setTimeout(() => {
          setShowSwipeHint(true);
          if (!reducedMotion) {
            hintScale.value = withRepeat(
              withSequence(
                withTiming(1.06, { duration: 220 }),
                withTiming(1, { duration: 220 })
              ),
              3,
              false
            );
          }
        }, 1400);
      })
      .catch(() => {});

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [hintScale, reducedMotion]);

  useEffect(() => {
    if (!showSwipeHint) return;
    const timer = setTimeout(() => setShowSwipeHint(false), 6000);
    return () => clearTimeout(timer);
  }, [showSwipeHint]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = screenWidth > 0 ? Math.round(contentOffsetX / screenWidth) : 0;
    if (currentIndex < 0 || currentIndex > 2) return;

    const isProgrammatic = currentIndex === programmaticSlideRef.current;
    if (isProgrammatic) programmaticSlideRef.current = null;

    if (currentIndex !== activeIndex) {
      setActiveIndex(currentIndex);
      if (!isProgrammatic) Haptics.selectionAsync().catch(() => {});
    }

    // Leaving slide 1 always returns it to the greeting so the cover never
    // comes back showing the year progress panel mid-state.
    if (currentIndex !== 0 && verticalPage !== 0) {
      setVerticalPage(0);
      translateY.set(0);
    }
  };

  const goToSlide = (index: number) => {
    if (index === activeIndex) return;
    programmaticSlideRef.current = index;
    setActiveIndex(index);
    resetAutoSlide();
    Haptics.selectionAsync().catch(() => {});
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  const currentQuote = getQuoteOfTheDay(now);

  const formatTemp = (tempC: number) => {
    if (temperatureUnit === 'F') {
      return `${Math.round((tempC * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(tempC)}°C`;
  };

  const displayTemp = formatTemp(weather.tempC);
  const displayHigh = formatTemp(weather.tempMaxC);
  const displayLow = formatTemp(weather.tempMinC);

  const greeting = progress.greetingLabel;

  const todayStr = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'short', day: 'numeric' }).format(now);

  const topPadding = Math.max(insets.top + 10, 38);

  // Compare the same slice of this month with the same slice of last month, so
  // an early-month check does not look falsely cheaper than a full month.
  const lastMonthToDateSpent = useMemo(() => {
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return expenses.reduce((sum, expense) => {
      const date = new Date(expense.date);
      const isSameMonth =
        date.getFullYear() === previousMonth.getFullYear() &&
        date.getMonth() === previousMonth.getMonth();
      return isSameMonth && date.getDate() <= progress.dayOfMonth ? sum + expense.amount : sum;
    }, 0);
  }, [expenses, now, progress.dayOfMonth]);

  const lastMonthLabel = MONTH_SHORT.format(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const spendDiffPercent =
    lastMonthToDateSpent > 0
      ? Math.round((Math.abs(monthlySpent - lastMonthToDateSpent) / lastMonthToDateSpent) * 100)
      : 0;
  const spendWentUp = monthlySpent > lastMonthToDateSpent;
  const showTrend = lastMonthToDateSpent > 0 && spendDiffPercent > 0;
  const trendColor = spendWentUp ? theme.warningOnBrand : theme.successOnBrand;
  const trendBackground = spendWentUp ? 'rgba(251, 191, 36, 0.18)' : 'rgba(52, 211, 153, 0.18)';
  const dailyAverage = monthlySpent / Math.max(1, progress.dayOfMonth);

  const isGreetingPage = verticalPage === 0;

  return (
    <View style={[styles.container, { width: screenWidth }]}>
      {/* FULL-WIDTH EDGE-TO-EDGE FACEBOOK MOBILE COVER CAROUSEL */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={resetAutoSlide}
        scrollEventThrottle={16}
        decelerationRate="normal"
        snapToInterval={screenWidth}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SLIDE 1: COVER PHOTO WITH GREETING / YEAR PROGRESS SWAPPING UP-DOWN */}
        <View style={[styles.slideCard, { width: screenWidth }]}>
            <Animated.Image
              source={getCoverSource(profile.coverPhotoUri)}
              style={[styles.fullCoverImage, coverImageStyle]}
            />
            <LinearGradient
              colors={['rgba(0,0,0,0.24)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.88)']}
              locations={[0, 0.42, 1]}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.scrimBoost, scrimBoostStyle]}
            />

            <Animated.View
              style={[styles.verticalTrack, { height: HERO_HEIGHT * 2 }, verticalTrackStyle]}>
              {/* PAGE A: GREETING */}
              <Animated.View
                accessibilityElementsHidden={verticalPage !== 0}
                importantForAccessibility={verticalPage === 0 ? 'auto' : 'no-hide-descendants'}
                style={[
                  styles.coverPage,
                  { paddingTop: topPadding },
                  pageAContentStyle,
                ]}>
                <View style={styles.brandChip}>
                  <MaterialCommunityIcons name="wallet" size={13} color="#FFFFFF" />
                  <Text style={styles.brandMark}>CASHTRACK</Text>
                </View>

                <View style={styles.bottomStack}>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onPressProfile || (() => router.push('/profile'))}
                    accessibilityRole="button"
                    accessibilityLabel={`Profile overview for ${profile.name || 'User'}`}
                    accessibilityHint="Opens your profile"
                    style={styles.profileRow}>
                    <View
                      style={[
                        styles.avatarContainer,
                        { borderColor: 'rgba(255,255,255,0.92)', backgroundColor: theme.background },
                      ]}>
                      {profile.profilePhotoUri ? (
                        <Image source={{ uri: profile.profilePhotoUri }} style={styles.avatarImage} />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.accentFill }]}>
                          <Text style={styles.avatarInitial}>
                            {profile.name ? profile.name.charAt(0).toUpperCase() : 'S'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.profileTextInfo}>
                      <Text style={styles.greetingLabel} numberOfLines={1}>
                        {greeting}
                      </Text>
                      <Text style={styles.whiteTitle} numberOfLines={1}>
                        {profile.name?.trim() || 'User'}
                      </Text>
                      <View style={styles.profileDateRow}>
                        <Ionicons
                          name="calendar-outline"
                          size={11}
                          color="rgba(255,255,255,0.76)"
                        />
                        <Text style={styles.whiteSubtext} numberOfLines={1}>
                          {todayStr}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.profileChevron}>
                      <Ionicons name="chevron-forward" size={15} color="rgba(255,255,255,0.92)" />
                    </View>
                  </TouchableOpacity>

                  <View style={styles.balancePanel}>
                    <View style={styles.panelTopRow}>
                      <View style={styles.panelLabelGroup}>
                        <View style={styles.panelDot} />
                        <Text style={styles.balanceEyebrow}>TOTAL BALANCE</Text>
                      </View>

                      {showTrend && (
                        <View style={[styles.trendPill, { backgroundColor: trendBackground }]}>
                          <Text
                            style={[styles.trendText, { color: trendColor }]}
                            numberOfLines={1}>
                            Spent {spendWentUp ? '+' : '−'}
                            {spendDiffPercent}% vs {lastMonthLabel}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[styles.balanceValue, totalBalance < 0 && styles.balanceValueNegative]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}>
                      {formatAmount(totalBalance)}
                    </Text>

                    <View style={styles.panelDivider} />

                    <View style={styles.panelStatsRow}>
                      <View style={styles.panelStat}>
                        <Text style={styles.panelStatLabel} numberOfLines={1}>
                          SPENT IN {progress.monthShortLabel.toUpperCase()}
                        </Text>
                        <Text
                          style={styles.panelStatValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.5}>
                          {formatAmount(monthlySpent)}
                        </Text>
                      </View>

                      <View style={styles.panelStatDivider} />

                      <View style={styles.panelStat}>
                        <Text style={styles.panelStatLabel} numberOfLines={1}>AVG / DAY</Text>
                        <Text
                          style={styles.panelStatValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.5}>
                          {formatAmount(dailyAverage)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </Animated.View>

              {/* PAGE B: YEAR PROGRESS */}
              <Animated.View style={[styles.panelPage, pageBContentStyle]}>
                <YearProgressPanel
                  progress={progress}
                  monthlySpend={monthlySpend}
                  formatAmount={formatAmount}
                  height={HERO_HEIGHT}
                  topPadding={topPadding}
                  hidden={verticalPage !== 1}
                />
              </Animated.View>
            </Animated.View>

            {/* Single vertical affordance: teaser, state and control in one chip */}
            <Animated.View
              style={[styles.verticalToggleWrap, { top: topPadding }, hintStyle]}>
              <Pressable
                onPress={() => goToVerticalPage(isGreetingPage ? 1 : 0)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityState={{ expanded: !isGreetingPage }}
                accessibilityLabel={
                  isGreetingPage
                    ? `Year progress, ${progress.yearPercent} percent of ${progress.year} elapsed. Opens year progress.`
                    : 'Greeting. Returns to the greeting.'
                }
                style={({ pressed }) => [styles.verticalToggle, pressed && styles.verticalTogglePressed]}>
                <Ionicons
                  name={isGreetingPage ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.verticalToggleText} numberOfLines={1}>
                  {isGreetingPage ? `${progress.yearPercent}% of ${progress.year}` : 'Greeting'}
                </Text>
              </Pressable>
            </Animated.View>

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
          style={[styles.slideCard, { width: screenWidth }]}>
          <WeatherBackground conditionType={weather.conditionType} />

          <View style={[styles.cardInner, { paddingTop: topPadding }]}>
            <View style={styles.topRowBadge}>
              {/* Extra Forecast Pills */}
              <View style={styles.metricsRow}>
                <View style={styles.metricPill}>
                  <Ionicons name="umbrella" size={11} color="#60a5fa" />
                  <Text style={styles.metricText}>{weather.rainProbability}%</Text>
                </View>
                <View style={styles.metricPill}>
                  <Ionicons name="water" size={11} color="#38bdf8" />
                  <Text style={styles.metricText}>{weather.humidity}%</Text>
                </View>
              </View>

              <View style={styles.outlookPill}>
                <Ionicons name="location" size={12} color="#38bdf8" />
                <Text style={styles.outlookText} numberOfLines={1}>{weather.locationName}</Text>
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
                <DualClockWidget variant="compact" />
              </View>
            </View>

            <View style={styles.slideHint}>
              <Ionicons name="information-circle-outline" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.slideHintText}>Tap card for details</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* SLIDE 3: DAILY WISDOM QUOTE CARD (Reference Style) */}
        <View style={[styles.slideCard, styles.quoteCardContainer, { width: screenWidth }]}>
          <LinearGradient
            colors={['#000B76', '#00109D', '#0152F5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.quoteBgGlow1} />
          <View pointerEvents="none" style={styles.quoteBgGlow2} />
          <View pointerEvents="none" style={styles.quoteBgGlow3} />
          <Text pointerEvents="none" style={styles.backgroundWatermarkQuote}>“</Text>

          {/* Floating Quote Badge overlapping top-left */}
          <View style={[styles.floatingQuoteBadge, { top: topPadding + 16 }]}>
            <Text style={styles.floatingQuoteSymbol}>“</Text>
          </View>

          <View style={[styles.quoteCardWrapper, { paddingTop: topPadding + 38 }]}>
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
        {SLIDE_LABELS.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => goToSlide(index)}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected: activeIndex === index }}
            style={styles.dotTarget}>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: activeIndex === index ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                  width: activeIndex === index ? 22 : 6,
                },
              ]}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollContent: {
    // Edge to edge cover
  },
  slideCard: {
    height: HERO_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fullCoverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    resizeMode: 'cover',
  },
  scrimBoost: {
    backgroundColor: '#000000',
  },
  verticalTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  coverPage: {
    height: HERO_HEIGHT,
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  panelPage: {
    height: HERO_HEIGHT,
  },
  brandChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 11,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(8,12,28,0.34)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  brandMark: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  bottomStack: {
    gap: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingRight: 2,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
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
    gap: 1,
  },
  greetingLabel: {
    color: 'rgba(255, 255, 255, 0.84)',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 15,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 27,
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  profileDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.78)',
    fontSize: 11.5,
    fontWeight: '500',
    lineHeight: 14,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  profileChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  balancePanel: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: 'rgba(6,10,24,0.5)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 5,
    overflow: 'hidden',
  },
  panelTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  panelLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  panelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#14E7FD',
  },
  balanceEyebrow: {
    color: 'rgba(255,255,255,0.68)',
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 1.3,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    flexShrink: 1,
    minWidth: 0,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 38,
    lineHeight: 42,
    fontWeight: '800',
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  balanceValueNegative: {
    color: '#FFB4B4',
  },
  panelDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.14)',
    marginVertical: 6,
  },
  panelStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  panelStat: {
    flex: 1,
    gap: 2,
  },
  panelStatLabel: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  panelStatValue: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 18,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  panelStatDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  verticalToggleWrap: {
    position: 'absolute',
    right: H_PADDING,
    zIndex: 5,
  },
  verticalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 30,
    backgroundColor: 'rgba(8,12,28,0.34)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.24)',
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
  },
  verticalTogglePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  verticalToggleText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  topRowBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  outlookPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: '58%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 12.5,
    fontWeight: '600',
    flexShrink: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 11,
  },
  metricText: {
    color: '#FFFFFF',
    fontSize: 11.5,
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
    alignSelf: 'flex-start',
    gap: 2,
  },
  slideHintText: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  quoteCardContainer: {
    backgroundColor: Brand.deep,
    overflow: 'hidden',
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
  quoteBgGlow3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    right: 30,
    bottom: -40,
    backgroundColor: 'rgba(20, 231, 253, 0.15)',
  },
  backgroundWatermarkQuote: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    fontSize: 160,
    fontWeight: '900',
    color: 'rgba(255, 255, 255, 0.05)',
    lineHeight: 160,
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
    paddingHorizontal: H_PADDING,
    paddingBottom: 30,
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
    bottom: 12,
    left: 0,
    right: 0,
  },
  dotTarget: {
    height: 12,
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
