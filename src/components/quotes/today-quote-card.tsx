import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion, ZoomIn } from 'react-native-reanimated';

import { quoteTopicLabel } from '@/components/quotes/topic-style';
import type { FinancialQuote } from '@/constants/quotes';
import { Elevation, Fonts, LaunchQuoteColors, Radius, Spacing, Typography } from '@/constants/theme';

type TodayQuoteCardProps = {
  quote: FinancialQuote;
  dateLabel: string;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  onCopy: () => void;
};

/**
 * The day's quote at the top of the Quotes page. Same night-sky colours as the
 * opening screen, so it reads as the same quote people saw when they opened
 * the app.
 */
export function TodayQuoteCard({ quote, dateLabel, saved, onToggleSave, onShare, onCopy }: TodayQuoteCardProps) {
  const reduceMotion = useReducedMotion();
  const topic = quote.topics[0];

  return (
    <View style={styles.shell}>
      <LinearGradient
        colors={[LaunchQuoteColors.base, LaunchQuoteColors.mid, LaunchQuoteColors.edge]}
        locations={[0, 0.62, 1]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.glow} />

      <View style={styles.header}>
        <View style={styles.eyebrowRow}>
          <MaterialCommunityIcons name="format-quote-open" size={16} color={LaunchQuoteColors.author} />
          <Text style={styles.eyebrow} maxFontSizeMultiplier={1.3} numberOfLines={1}>
            QUOTE OF THE DAY
          </Text>
        </View>
        <Text style={styles.date} maxFontSizeMultiplier={1.3} numberOfLines={1}>
          {dateLabel}
        </Text>
      </View>

      <Pressable
        onLongPress={onCopy}
        delayLongPress={350}
        accessibilityRole="text"
        accessibilityLabel={`Quote of the day: ${quote.quote} By ${quote.author}.`}
        accessibilityHint="Long press to copy"
        accessibilityActions={[{ name: 'longpress', label: 'Copy quote' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'longpress') onCopy();
        }}
        style={styles.quoteBody}>
        <View style={styles.quoteAccent} />
        <View style={styles.quoteColumn}>
          <Text style={styles.quote} maxFontSizeMultiplier={1.3}>
            {quote.quote}
          </Text>
          <View style={styles.authorRow}>
            <View style={styles.authorRule} />
            <Text style={styles.author} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {quote.author}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.footer}>
        {topic ? (
          <View style={styles.topicChip}>
            <Text style={styles.topicText} maxFontSizeMultiplier={1.3} numberOfLines={1}>
              {quoteTopicLabel(topic)}
            </Text>
          </View>
        ) : (
          <View />
        )}
        <View style={styles.actions}>
          <Pressable
            onPress={onToggleSave}
            accessibilityRole="button"
            accessibilityState={{ selected: saved }}
            accessibilityLabel={saved ? 'Remove from saved quotes' : 'Save quote'}
            style={({ pressed }) => [styles.pill, saved && styles.pillSaved, pressed && styles.pillPressed]}>
            <Animated.View
              key={saved ? 'saved' : 'unsaved'}
              entering={reduceMotion ? undefined : ZoomIn.springify().damping(12)}>
              <MaterialCommunityIcons
                name={saved ? 'heart' : 'heart-outline'}
                size={17}
                color={saved ? LaunchQuoteColors.author : LaunchQuoteColors.muted}
              />
            </Animated.View>
            <Text style={[styles.pillText, saved && styles.pillTextSaved]} maxFontSizeMultiplier={1.3}>
              {saved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
          <Pressable
            onPress={onShare}
            accessibilityRole="button"
            accessibilityLabel="Share quote"
            style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
            <MaterialCommunityIcons name="share-variant" size={16} color={LaunchQuoteColors.muted} />
            <Text style={styles.pillText} maxFontSizeMultiplier={1.3}>
              Share
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: Radius.xlarge,
    overflow: 'hidden',
    padding: Spacing.three + 4,
    gap: Spacing.three,
    backgroundColor: LaunchQuoteColors.base,
    ...Elevation.medium,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -90,
    right: -70,
    backgroundColor: LaunchQuoteColors.glowCyan,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  eyebrowRow: {
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
  date: {
    ...Typography.micro,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  quoteBody: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  quoteAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: LaunchQuoteColors.mark,
  },
  quoteColumn: {
    flex: 1,
    gap: Spacing.three,
  },
  quote: {
    ...Typography.title,
    lineHeight: 30,
    color: LaunchQuoteColors.text,
    fontFamily: Fonts?.serif,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
  },
  authorRule: {
    width: 28,
    height: 2,
    borderRadius: 1,
    backgroundColor: LaunchQuoteColors.author,
  },
  author: {
    ...Typography.caption,
    color: LaunchQuoteColors.author,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  topicChip: {
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    backgroundColor: LaunchQuoteColors.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LaunchQuoteColors.hairline,
  },
  topicText: {
    ...Typography.micro,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    backgroundColor: LaunchQuoteColors.chip,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: LaunchQuoteColors.hairline,
  },
  pillSaved: {
    borderColor: LaunchQuoteColors.mark,
  },
  pillPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  pillText: {
    ...Typography.caption,
    color: LaunchQuoteColors.muted,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  pillTextSaved: {
    color: LaunchQuoteColors.author,
  },
});
