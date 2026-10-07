import React, { useState, useRef } from 'react';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const FINANCIAL_QUOTES = [
  {
    quote: "Do not save what is left after spending, but spend what is left after saving.",
    author: "Warren Buffett",
  },
  {
    quote: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett",
  },
  {
    quote: "A budget is telling your money where to go instead of wondering where it went.",
    author: "Dave Ramsey",
  },
  {
    quote: "Beware of little expenses; a small leak will sink a great ship.",
    author: "Benjamin Franklin",
  },
  {
    quote: "An investment in knowledge pays the best interest.",
    author: "Benjamin Franklin",
  },
  {
    quote: "Wealth is not having a lot of money; it's having a lot of options.",
    author: "Chris Rock",
  },
];

const WEATHER_TIPS = [
  {
    temp: "72°F",
    condition: "Sunny & Bright",
    city: "Your City",
    icon: "sunny" as const,
    tip: "Great weather for a walk! Skip the rideshare and save today.",
  },
  {
    temp: "68°F",
    condition: "Mild Breeze",
    city: "Your City",
    icon: "partly-sunny" as const,
    tip: "Perfect day to meal-prep at home and boost your savings.",
  },
  {
    temp: "65°F",
    condition: "Cozy Rain",
    city: "Your City",
    icon: "rainy" as const,
    tip: "Rainy day indoors? Ideal time to review your monthly budget goals.",
  },
];

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
  const { formatAmount } = useExpenses();
  const [activeIndex, setActiveIndex] = useState(0);
  const [quoteIndex] = useState(() => Math.floor(Math.random() * FINANCIAL_QUOTES.length));
  const [weatherIndex] = useState(() => Math.floor(Math.random() * WEATHER_TIPS.length));
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const currentIndex = Math.round(contentOffsetX / BANNER_WIDTH);
    if (currentIndex !== activeIndex && currentIndex >= 0 && currentIndex <= 2) {
      setActiveIndex(currentIndex);
      Haptics.selectionAsync().catch(() => {});
    }
  };

  const currentQuote = FINANCIAL_QUOTES[quoteIndex] || FINANCIAL_QUOTES[0];
  const currentWeather = WEATHER_TIPS[weatherIndex] || WEATHER_TIPS[0];

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
        {/* FULL-SPACE COVER BACKGROUND RENDERER */}
        {/* SLIDE 1: GREETING, DATE & WEALTH OVERVIEW */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={onPressProfile || (() => router.push('/profile'))}
          style={[styles.card, { borderColor: theme.border }]}
        >
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            {/* Header: Avatar, Name & Greeting */}
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
              <View style={styles.greetingInfo}>
                <Text style={styles.whiteSubtext}>{todayStr}</Text>
                <Text style={styles.whiteTitle} numberOfLines={1}>
                  {getGreeting()}, {profile.name ? profile.name.split(/\s+/)[0] : 'User'}
                </Text>
              </View>
              <View style={styles.iconCircle}>
                <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
              </View>
            </View>

            {/* Financial Summary Box */}
            <View style={styles.glassFinBar}>
              <View style={styles.finItem}>
                <Text style={styles.glassFinLabel}>Net Balance</Text>
                <Text style={styles.glassFinValue}>{formatAmount(totalBalance)}</Text>
              </View>
              <View style={styles.glassDivider} />
              <View style={styles.finItem}>
                <Text style={styles.glassFinLabel}>Spent This Month</Text>
                <Text style={[styles.glassFinValue, { color: '#f87171' }]}>{formatAmount(monthlySpent)}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* SLIDE 2: WEATHER UPDATE */}
        <View style={[styles.card, { borderColor: theme.border }]}>
          <Image source={getCoverSource(profile.coverPhotoUri)} style={styles.fullCoverImage} />
          <View style={styles.overlayGradient} />

          <View style={styles.cardInner}>
            <View style={styles.slideHeader}>
              <View style={styles.locationBadge}>
                <Ionicons name="location" size={14} color="#FFFFFF" />
                <Text style={styles.whiteSubtext}>{currentWeather.city}</Text>
              </View>
              <View style={styles.outlookPill}>
                <Ionicons name={currentWeather.icon} size={14} color="#38bdf8" />
                <Text style={styles.outlookText}>Live Weather</Text>
              </View>
            </View>

            <View style={styles.weatherCenter}>
              <Text style={styles.giantTemp}>{currentWeather.temp}</Text>
              <Text style={styles.whiteSubtext}>{currentWeather.condition}</Text>
            </View>

            <View style={styles.glassTipBox}>
              <Ionicons name="bulb" size={16} color="#facc15" />
              <Text style={styles.tipContentText}>{currentWeather.tip}</Text>
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
              <Ionicons name="chatbubble-outline" size={20} color="rgba(255,255,255,0.7)" />
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  greetingInfo: {
    flex: 1,
  },
  whiteSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  whiteTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassFinBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
  },
  finItem: {
    flex: 1,
    alignItems: 'center',
  },
  glassFinLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 2,
  },
  glassFinValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  glassDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
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
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  outlookText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '600',
  },
  weatherCenter: {
    marginVertical: 4,
  },
  giantTemp: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  glassTipBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    gap: 8,
  },
  tipContentText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  wisdomPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 132, 252, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  wisdomText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '600',
  },
  quoteBody: {
    justifyContent: 'center',
    marginVertical: 4,
  },
  quoteBodyText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
    lineHeight: 18,
    marginBottom: 6,
  },
  quoteAuthorText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'right',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
});
