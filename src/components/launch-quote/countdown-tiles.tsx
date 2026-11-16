import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FlipInXUp,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Elevation, glow, LaunchQuoteColors, Radius, Spacing, Typography } from '@/constants/theme';
import type { YearProgress } from '@/utils/year-progress';

const TILE_HEIGHT = 60;
const TILE_HEIGHT_COMPACT = 48;
const FLIP_MS = 520;
const FLIP_STAGGER_MS = 90;
const GROUP_TITLE_LINE = 14;
const BRACKET_HEIGHT = 6;
const GROUP_GAP = 6;
/** Space above the tiles (title + gap + bracket + gap), so the colon lines up with the tiles. */
const TILE_TOP_OFFSET = GROUP_TITLE_LINE + GROUP_GAP + BRACKET_HEIGHT + GROUP_GAP;

type CountdownCardProps = {
  progress: YearProgress;
  /** Year countdown text that rotates days → hours → minutes. */
  countdownText: string;
  /** Wait this long (ms) before the first tile flips in, to line up with the screen's entrance. */
  startDelay?: number;
  /** Short phones: smaller tiles and no year bar, so the quote below still fits. */
  compact?: boolean;
};

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`;
}

/** The countdown as one spoken sentence, for screen readers. */
export function countdownSentence(progress: YearProgress): string {
  return (
    `${plural(progress.daysLeftInMonth, 'day', 'days')} and ${plural(progress.weeksLeftInMonth, 'week', 'weeks')} left in ${progress.monthLabel}. ` +
    `${plural(progress.weeksLeftInYear, 'week', 'weeks')} and ${plural(progress.daysLeftInYear, 'day', 'days')} left in ${progress.year}.`
  );
}

/**
 * Watch-style "time left" card for the launch screen: days and weeks left this
 * month, then weeks and days left this year, as flip-clock tiles, with the year
 * progress bar underneath. Read out by the parent button, so it is hidden from
 * screen readers here.
 */
export function CountdownCard({ progress, countdownText, startDelay = 0, compact = false }: CountdownCardProps) {
  const reducedMotion = useReducedMotion();
  const colonOpacity = useSharedValue(1);
  const animate = !reducedMotion;

  // Watch colon: a slow one-second blink, dropped with Reduce Motion.
  useEffect(() => {
    if (reducedMotion) {
      cancelAnimation(colonOpacity);
      colonOpacity.value = 1;
      return;
    }
    colonOpacity.value = withRepeat(
      withSequence(withTiming(0.25, { duration: 500 }), withTiming(1, { duration: 500 })),
      -1,
      false
    );
    return () => cancelAnimation(colonOpacity);
  }, [reducedMotion, colonOpacity]);

  const colonStyle = useAnimatedStyle(() => ({ opacity: colonOpacity.value }));

  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={styles.card}>
      {/* Card header */}
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <MaterialCommunityIcons name="timer-sand" size={14} color={LaunchQuoteColors.author} />
          <Text style={styles.eyebrow} numberOfLines={1} maxFontSizeMultiplier={1.3}>
            TIME LEFT
          </Text>
        </View>
        <Text style={styles.headerMeta} numberOfLines={1} maxFontSizeMultiplier={1.3}>
          Week {progress.weekOfYear} of {progress.totalWeeksInYear}
        </Text>
      </View>

      {/* Tiles */}
      <View style={styles.tilesLayout}>
        <TileGroup title={progress.monthLabel.toUpperCase()}>
          <FlipTile value={progress.daysLeftInMonth} digits={2} caption="DAYS" delay={startDelay} animate={animate} compact={compact} />
          <FlipTile value={progress.weeksLeftInMonth} digits={2} caption="WEEKS" delay={startDelay + FLIP_STAGGER_MS} animate={animate} compact={compact} />
        </TileGroup>

        <View style={[styles.colonColumn, compact && styles.colonColumnCompact]}>
          <Animated.View style={[styles.colon, colonStyle]}>
            <View style={styles.colonDot} />
            <View style={styles.colonDot} />
          </Animated.View>
        </View>

        <TileGroup title={String(progress.year)}>
          <FlipTile value={progress.weeksLeftInYear} digits={2} caption="WEEKS" delay={startDelay + FLIP_STAGGER_MS * 2} animate={animate} compact={compact} />
          <FlipTile value={progress.daysLeftInYear} digits={3} caption="DAYS" delay={startDelay + FLIP_STAGGER_MS * 3} animate={animate} compact={compact} />
        </TileGroup>
      </View>

      {/* Year progress (left out on short phones; the tiles already show the year) */}
      {compact ? null : (
        <>
          <View style={styles.divider} />
          <View style={styles.progressBlock}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {`${progress.yearPercent}% of ${progress.year} done`}
              </Text>
              <Text style={styles.progressValue} numberOfLines={1} maxFontSizeMultiplier={1.3}>
                {countdownText}
              </Text>
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${progress.yearPercent}%` }]} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

function TileGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {title}
      </Text>
      <View style={styles.bracket} />
      <View style={styles.tilesRow}>{children}</View>
    </View>
  );
}

function FlipTile({
  value,
  digits,
  caption,
  delay,
  animate,
  compact,
}: {
  value: number;
  digits: number;
  caption: string;
  delay: number;
  animate: boolean;
  compact: boolean;
}) {
  const text = String(Math.max(0, value)).padStart(digits, '0');

  return (
    <View style={styles.tileColumn}>
      <View style={[styles.tile, compact && styles.tileCompact]}>
        <View pointerEvents="none" style={styles.tileTopHalf} />
        {/* New key = new digits, so the flip replays whenever the number changes. */}
        <Animated.Text
          key={text}
          entering={animate ? FlipInXUp.delay(delay).duration(FLIP_MS) : undefined}
          style={[styles.tileValue, compact && styles.tileValueCompact]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
          adjustsFontSizeToFit
          minimumFontScale={0.6}>
          {text}
        </Animated.Text>
        <View pointerEvents="none" style={styles.tileSeam} />
        <View pointerEvents="none" style={[styles.hinge, styles.hingeLeft]} />
        <View pointerEvents="none" style={[styles.hinge, styles.hingeRight]} />
      </View>
      <Text style={styles.tileCaption} numberOfLines={1} maxFontSizeMultiplier={1.2}>
        {caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.xlarge,
    backgroundColor: LaunchQuoteColors.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LaunchQuoteColors.hairline,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  eyebrow: {
    ...Typography.micro,
    color: LaunchQuoteColors.text,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  headerMeta: {
    ...Typography.micro,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 0.4,
    fontVariant: ['tabular-nums'],
  },
  tilesLayout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  group: {
    flex: 1,
    gap: GROUP_GAP,
  },
  groupTitle: {
    fontSize: 11,
    lineHeight: GROUP_TITLE_LINE,
    color: LaunchQuoteColors.author,
    fontWeight: '800',
    letterSpacing: 1.6,
    textAlign: 'center',
  },
  // Legs land on the centre of each tile, like the bracket on a stopwatch face.
  bracket: {
    height: BRACKET_HEIGHT,
    marginHorizontal: '25%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(143, 239, 255, 0.45)',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tilesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  tileColumn: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  tile: {
    alignSelf: 'stretch',
    height: TILE_HEIGHT,
    borderRadius: Radius.small + 2,
    backgroundColor: 'rgba(3, 8, 32, 0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 4,
    ...Elevation.onMedia,
  },
  tileCompact: {
    height: TILE_HEIGHT_COMPACT,
  },
  tileValueCompact: {
    ...Typography.title,
  },
  colonColumnCompact: {
    height: TILE_HEIGHT_COMPACT,
  },
  tileTopHalf: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  tileValue: {
    color: LaunchQuoteColors.text,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  tileSeam: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  hinge: {
    position: 'absolute',
    top: '50%',
    marginTop: -4,
    width: 3,
    height: 8,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  hingeLeft: { left: 1 },
  hingeRight: { right: 1 },
  tileCaption: {
    fontSize: 11,
    lineHeight: 14,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  colonColumn: {
    width: 22,
    marginTop: TILE_TOP_OFFSET,
    height: TILE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colon: {
    gap: 10,
    alignItems: 'center',
  },
  colonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Brand.bright,
    boxShadow: glow(Brand.bright, 'strong'),
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: LaunchQuoteColors.hairline,
  },
  progressBlock: {
    gap: Spacing.two,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  progressLabel: {
    ...Typography.micro,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  progressValue: {
    ...Typography.caption,
    color: LaunchQuoteColors.text,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: LaunchQuoteColors.author,
  },
});
