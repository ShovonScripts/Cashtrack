import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
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
import { useExpenses } from '@/context/expense-context';
import type { UserProfile } from '@/types/preferences';
import { getCoverSource } from '@/constants/cover-presets';
import { getQuoteOfTheDay } from '@/constants/quotes';
import { fetchLiveWeatherData, DEFAULT_WEATHER_DATA, type WeatherData } from '@/utils/weather';
import { getYearProgress } from '@/utils/year-progress';
import { AnimatedWeather } from '@/components/animated-weather';
import { WeatherBackground } from '@/components/weather-background';
import { DualClockWidget } from '@/components/dashboard/DualClockWidget';
import { YearProgressPanel } from '@/components/dashboard/year-progress-panel';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = 300;
const SWIPE_HINT_KEY = '@cashtrack_cover_swipe_hint_seen';
const VERTICAL_SPRING = { damping: 24, stiffness: 200, mass: 0.9 } as const;
const SLIDE_LABELS = ['Cover', 'Weather', 'Daily wisdom'] as const;

interface FacebookCoverHeaderProps {
  profile: UserProfile;
  totalBalance?: number;
  monthlySpent?: number;
  lastMonthSpent?: number;
  onPressProfile?: () => void;
  /** The home page ScrollView, used so the vertical cover swipe can block it. */
  pageScrollRef?: React.RefObject<ScrollView | null>;
  /** True while the home page is scrolled away from the top. */
  pageScrolled?: boolean;
}

export function FacebookCoverHeader({
  profile,
  totalBalance = 0,
  monthlySpent = 0,
  lastMonthSpent = 0,
  onPressProfile,
  pageScrollRef,
  pageScrolled = false,
}: FacebookCoverHeaderProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { temperatureUnit, formatAmount, firstDayOfWeek } = useExpenses();
  const [activeIndex, setActiveIndex] = useState(0);
  const [verticalPage, setVerticalPage] = useState(0);
  const [autoSlideKey, setAutoSlideKey] = useState(0);
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const reducedMotion = useReducedMotion();
  const now = useNow(60_000);
  const progress = getYearProgress(now, firstDayOfWeek);

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

  const blockablePageScrollRef = pageScrollRef as unknown as
    | React.RefObject<React.ComponentType | undefined | null>
    | undefined;

  const gesturesEnabled = !pageScrolled;

  const swipeUp = Gesture.Pan()
    .enabled(gesturesEnabled && verticalPage === 0)
    .activeOffsetY(-12)
    .failOffsetY(12)
    .failOffsetX([-14, 14])
    .onUpdate((event) => {
      translateY.value = Math.max(-HERO_HEIGHT, Math.min(0, event.translationY));
    })
    .onEnd((event) => {
      const shouldOpen = event.translationY < -HERO_HEIGHT * 0.28 || event.velocityY < -450;
      if (shouldOpen) {
        animateVerticalTo(1, (finished) => {
          if (finished) {
            runOnJS(applyVerticalPage)(1);
          }
        });
      } else {
        translateY.value = withSpring(0, VERTICAL_SPRING);
      }
    });

  const swipeDown = Gesture.Pan()
    .enabled(gesturesEnabled && verticalPage === 1)
    .activeOffsetY(12)
    .failOffsetY(-12)
    .failOffsetX([-14, 14])
    .onUpdate((event) => {
      translateY.value = Math.max(-HERO_HEIGHT, Math.min(0, -HERO_HEIGHT + event.translationY));
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > HERO_HEIGHT * 0.28 || event.velocityY > 450;
      if (shouldClose) {
        animateVerticalTo(0, (finished) => {
          if (finished) {
            runOnJS(applyVerticalPage)(0);
          }
        });
      } else {
        translateY.value = withSpring(-HERO_HEIGHT, VERTICAL_SPRING);
      }
    });

  if (blockablePageScrollRef) {
    swipeUp.blocksExternalGesture(blockablePageScrollRef);
    swipeDown.blocksExternalGesture(blockablePageScrollRef);
  }

  const verticalTrackStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const coverImageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : translateY.value * 0.35 }],
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
        x: nextIndex * SCREEN_WIDTH,
        animated: true,
      });
    }, 10000);

    return () => clearInterval(timer);
  }, [activeIndex, autoSlideKey, verticalPage]);

  useEffect(() => {
    async function loadWeather() {
      const data = await fetchLiveWeatherData();
      setWeather(data);
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
    const currentIndex = Math.round(contentOffsetX / SCREEN_WIDTH);
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
      x: index * SCREEN_WIDTH,
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

  const topPadding = Math.max(insets.top + 12, 40);

  const spendDiffPercent =
    lastMonthSpent > 0 ? Math.round((Math.abs(monthlySpent - lastMonthSpent) / lastMonthSpent) * 100) : 0;
  const spendWentUp = monthlySpent > lastMonthSpent;

  const showYearProgress = verticalPage === 0;

  return (
    <View style={styles.container}>
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
        snapToInterval={SCREEN_WIDTH}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SLIDE 1: COVER PHOTO WITH GREETING / YEAR PROGRESS SWAPPING UP-DOWN */}
        <GestureDetector gesture={verticalPage === 0 ? swipeUp : swipeDown}>
          <View style={styles.slideCard}>
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
                <Text style={styles.brandMark}>CASHTRACK</Text>

                <View style={styles.profileBlock}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={onPressProfile || (() => router.push('/profile'))}
                    accessibilityRole="button"
                    accessibilityLabel={`Profile overview for ${profile.name || 'User'}`}
                    style={styles.profileRow}>
                    <View
                      style={[
                        styles.avatarContainer,
                        { borderColor: '#FFFFFF', backgroundColor: theme.background },
                      ]}>
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
                      <Text style={styles.whiteTitle} numberOfLines={1}>
                        {greeting}, {profile.name ? profile.name.split(/\s+/)[0] : 'User'}
                      </Text>
                      <Text style={styles.whiteSubtext}>{todayStr}</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.balanceBlock}>
                    <Text style={styles.balanceEyebrow}>NET BALANCE</Text>
                    <Text
                      style={styles.balanceValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit>
                      {formatAmount(totalBalance)}
                    </Text>
                    <Text style={styles.balanceMeta} numberOfLines={1}>
                      Spent in {progress.monthShortLabel} · {formatAmount(monthlySpent)}
                      {spendDiffPercent > 0
                        ? `   ${spendWentUp ? '↑' : '↓'} ${spendDiffPercent}%`
                        : ''}
                    </Text>
                  </View>
                </View>
              </Animated.View>

              {/* PAGE B: YEAR PROGRESS */}
              <Animated.View style={[styles.panelPage, pageBContentStyle]}>
                <YearProgressPanel
                  progress={progress}
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
                onPress={() => goToVerticalPage(showYearProgress ? 1 : 0)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityState={{ expanded: !showYearProgress }}
                accessibilityLabel={
                  showYearProgress
                    ? `Year progress, ${progress.yearPercent} percent of ${progress.year} elapsed. Opens year progress.`
                    : 'Greeting. Returns to the greeting.'
                }
                style={({ pressed }) => [styles.verticalToggle, pressed && styles.verticalTogglePressed]}>
                <Ionicons
                  name={showYearProgress ? 'chevron-up' : 'chevron-down'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.verticalToggleText} numberOfLines={1}>
                  {showYearProgress ? `Year progress · ${progress.yearPercent}%` : 'Greeting'}
                </Text>
              </Pressable>
            </Animated.View>

            {showSwipeHint && showYearProgress && (
              <Pressable
                onPress={() => setShowSwipeHint(false)}
                accessibilityRole="button"
                accessibilityLabel="Dismiss hint"
                style={[styles.swipeHint, { top: topPadding + 42 }]}>
                <Ionicons name="arrow-up" size={11} color="#FFFFFF" />
                <Text style={styles.swipeHintText}>Swipe up for your year</Text>
              </Pressable>
            )}
          </View>
        </GestureDetector>

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
                <DualClockWidget variant="compact" readOnly />
              </View>
            </View>

            <View style={styles.slideHint}>
              <Text style={styles.slideHintText}>Tap for details</Text>
              <Ionicons name="chevron-forward" size={12} color="rgba(255,255,255,0.8)" />
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
        {SLIDE_LABELS.map((label, index) => (
          <Pressable
            key={label}
            onPress={() => goToSlide(index)}
            hitSlop={12}
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
    width: SCREEN_WIDTH,
    marginBottom: 12,
  },
  scrollContent: {
    // Edge to edge cover
  },
  slideCard: {
    width: SCREEN_WIDTH,
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
    height: HERO_HEIGHT + 140,
    width: '100%',
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
    paddingHorizontal: 18,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  panelPage: {
    height: HERO_HEIGHT,
  },
  brandMark: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  profileBlock: {
    gap: 14,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
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
    fontSize: 19,
    fontWeight: '700',
  },
  profileTextInfo: {
    flex: 1,
    gap: 2,
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 12.5,
    fontWeight: '500',
  },
  balanceBlock: {
    gap: 1,
  },
  balanceEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  balanceValue: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  balanceMeta: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12.5,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  verticalToggleWrap: {
    position: 'absolute',
    right: 18,
    zIndex: 5,
  },
  verticalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.32)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.34)',
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  verticalTogglePressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  verticalToggleText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  swipeHint: {
    position: 'absolute',
    right: 18,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  swipeHintText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  cardInner: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
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
  dotTarget: {
    height: 12,
    justifyContent: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
