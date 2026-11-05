import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef } from 'react';
import { BackHandler, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FinancialQuote } from '@/constants/quotes';
import { Fonts, LaunchQuoteColors, Radius, Spacing, Typography } from '@/constants/theme';
import { getQuoteSizeRole } from '@/utils/launch-quote';
import type { GreetingPeriod } from '@/utils/year-progress';

/** Taps this soon after the screen appears are ignored, so a stray touch from launching the app does not skip it. */
const TAP_GUARD_MS = 450;

/** Fixed "stars" (x%, y%, size, opacity). Fixed so the sky looks the same each launch and costs nothing to compute. */
const STARS: readonly [number, number, number, number][] = [
  [8, 9, 2, 0.5], [22, 4, 1.5, 0.35], [37, 12, 2, 0.6], [55, 6, 1.5, 0.4],
  [71, 11, 2.5, 0.55], [88, 5, 1.5, 0.35], [93, 19, 2, 0.45], [14, 24, 1.5, 0.3],
  [80, 28, 1.5, 0.3], [6, 72, 1.5, 0.3], [91, 68, 2, 0.4], [18, 88, 2, 0.45],
  [46, 93, 1.5, 0.3], [74, 86, 2.5, 0.5], [62, 78, 1.5, 0.25],
];

type Props = {
  quote: FinancialQuote;
  greeting: string;
  dateLabel: string;
  period: GreetingPeriod;
  onContinue: () => void;
};

const PERIOD_ICON: Record<GreetingPeriod, keyof typeof MaterialCommunityIcons.glyphMap> = {
  morning: 'weather-sunset-up',
  afternoon: 'white-balance-sunny',
  evening: 'weather-sunset-down',
  night: 'weather-night',
};

/**
 * Full-screen motivational quote shown once per cold start. A tap anywhere
 * (or Android back) continues into the app. Always dark, with a soft animated
 * "night sky" in the brand blues; motion is dropped when Reduce Motion is on.
 */
export function LaunchQuoteOverlay({ quote, greeting, dateLabel, period, onContinue }: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const tapReady = useRef(false);
  const continued = useRef(false);

  const sizeRole = getQuoteSizeRole(quote.quote);
  const quoteType = Typography[sizeRole];

  useEffect(() => {
    const timer = setTimeout(() => {
      tapReady.current = true;
    }, TAP_GUARD_MS);
    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    if (continued.current || !tapReady.current) return;
    continued.current = true;
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync().catch(() => {});
    }
    onContinue();
  };

  // Android back continues into the app instead of closing it.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleContinue();
      return true;
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Slow drift of the glows and a gentle "breathing" scale on the hint. Scale,
  // not opacity, so the hint text never dips below AA contrast mid-pulse.
  const drift = useSharedValue(0);
  const hintPulse = useSharedValue(1);
  useEffect(() => {
    if (reduceMotion) return;
    drift.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.sin) }), -1, true);
    hintPulse.value = withDelay(
      1800,
      withRepeat(
        withSequence(
          withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [drift, hintPulse, reduceMotion]);

  const glowAStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * 28 }, { translateY: drift.value * -18 }, { scale: 1 + drift.value * 0.06 }],
  }));
  const glowBStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drift.value * -24 }, { translateY: drift.value * 22 }],
  }));
  const hintStyle = useAnimatedStyle(() => ({ transform: [{ scale: hintPulse.value }] }));

  const glowSize = Math.max(width, height) * 0.85;

  const stars = useMemo(
    () =>
      STARS.map(([x, y, size, opacity], i) => (
        <View
          key={i}
          style={[
            styles.star,
            { left: `${x}%`, top: `${y}%`, width: size, height: size, borderRadius: size, opacity },
          ]}
        />
      )),
    [],
  );

  const enter = (delay: number, duration = 700) =>
    reduceMotion ? FadeIn.duration(200) : FadeInDown.delay(delay).duration(duration).easing(Easing.out(Easing.cubic));

  return (
    <Animated.View
      entering={FadeIn.duration(reduceMotion ? 150 : 420)}
      exiting={FadeOut.duration(reduceMotion ? 150 : 380)}
      style={styles.root}
      accessibilityViewIsModal>
      <StatusBar style="light" />

      <LinearGradient
        colors={[LaunchQuoteColors.base, LaunchQuoteColors.mid, LaunchQuoteColors.edge]}
        locations={[0, 0.62, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        dither
        style={StyleSheet.absoluteFill}
      />

      {/* Soft glows: stacked translucent circles read as a radial blur without a blur pass. */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Animated.View style={[styles.glowAnchor, { top: -glowSize * 0.35, left: -glowSize * 0.3 }, glowAStyle]}>
          <Glow size={glowSize} color={LaunchQuoteColors.glowCyan} />
        </Animated.View>
        <Animated.View style={[styles.glowAnchor, { bottom: -glowSize * 0.4, right: -glowSize * 0.35 }, glowBStyle]}>
          <Glow size={glowSize} color={LaunchQuoteColors.glowViolet} />
        </Animated.View>
        <View style={[styles.glowAnchor, { top: height * 0.3, left: width * 0.15 }]}>
          <Glow size={glowSize * 0.7} color={LaunchQuoteColors.glowBlue} />
        </View>
        {stars}
      </View>

      <Pressable
        onPress={handleContinue}
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
            paddingLeft: insets.left + Spacing.four + 4,
            paddingRight: insets.right + Spacing.four + 4,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${greeting}. Quote: ${quote.quote}. By ${quote.author}.`}
        accessibilityHint="Double tap to continue to the app">
        {/* Greeting */}
        <Animated.View entering={enter(150, 600)} style={styles.header}>
          <View style={styles.greetingChip}>
            <MaterialCommunityIcons
              name={PERIOD_ICON[period]}
              size={16}
              color={LaunchQuoteColors.author}
            />
            <Text style={styles.greetingText} numberOfLines={1} maxFontSizeMultiplier={1.4}>
              {greeting}
            </Text>
          </View>
          <Text style={styles.dateText} maxFontSizeMultiplier={1.4}>
            {dateLabel}
          </Text>
        </Animated.View>

        {/* Quote */}
        <View style={styles.quoteBlock}>
          <Animated.View entering={reduceMotion ? FadeIn.duration(200) : FadeIn.delay(300).duration(900)}>
            <MaterialCommunityIcons name="format-quote-open" size={64} color={LaunchQuoteColors.mark} style={styles.mark} />
          </Animated.View>

          <Animated.View entering={enter(480, 850)}>
            <Text
              style={[
                styles.quoteText,
                { fontSize: quoteType.fontSize, lineHeight: Math.round(quoteType.fontSize * 1.32) },
              ]}
              maxFontSizeMultiplier={1.3}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              numberOfLines={9}>
              {quote.quote}
            </Text>
          </Animated.View>

          <Animated.View entering={enter(900, 700)} style={styles.authorRow}>
            <View style={styles.authorRule} />
            <Text style={styles.authorText} maxFontSizeMultiplier={1.4} numberOfLines={1}>
              {quote.author}
            </Text>
          </Animated.View>
        </View>

        {/* Continue hint */}
        <Animated.View entering={reduceMotion ? FadeIn.duration(200) : FadeIn.delay(1400).duration(700)} style={styles.footer}>
          <Animated.View style={[styles.hintPill, hintStyle]}>
            <MaterialCommunityIcons name="gesture-tap" size={16} color={LaunchQuoteColors.muted} />
            <Text style={styles.hintText} maxFontSizeMultiplier={1.4}>
              Tap anywhere to continue
            </Text>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

/** Four stacked circles of the same faint colour, darkest at the edge: a cheap radial glow. */
function Glow({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {[1, 0.74, 0.5, 0.3].map((scale) => (
        <View
          key={scale}
          style={{
            position: 'absolute',
            width: size * scale,
            height: size * scale,
            borderRadius: (size * scale) / 2,
            backgroundColor: color,
            opacity: 0.35,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 950,
    backgroundColor: LaunchQuoteColors.base,
    overflow: 'hidden',
  },
  glowAnchor: {
    position: 'absolute',
  },
  star: {
    position: 'absolute',
    backgroundColor: LaunchQuoteColors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  greetingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: 14,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: LaunchQuoteColors.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LaunchQuoteColors.hairline,
    maxWidth: '100%',
  },
  greetingText: {
    ...Typography.small,
    color: LaunchQuoteColors.text,
    fontWeight: '600',
    flexShrink: 1,
  },
  dateText: {
    ...Typography.micro,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    paddingLeft: 4,
  },
  quoteBlock: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  mark: {
    marginLeft: -10,
    marginBottom: -Spacing.three,
  },
  quoteText: {
    color: LaunchQuoteColors.text,
    fontFamily: Fonts?.serif,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    marginTop: Spacing.two,
  },
  authorRule: {
    width: 32,
    height: 2,
    borderRadius: 1,
    backgroundColor: LaunchQuoteColors.author,
  },
  authorText: {
    ...Typography.caption,
    color: LaunchQuoteColors.author,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  footer: {
    alignItems: 'center',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LaunchQuoteColors.hairline,
  },
  hintText: {
    ...Typography.caption,
    color: LaunchQuoteColors.muted,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
});
