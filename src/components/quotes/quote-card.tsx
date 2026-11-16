import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { QUOTE_TOPIC_COLORS, quoteTopicLabel } from '@/components/quotes/topic-style';
import { ThemedText } from '@/components/themed-text';
import { IconButton } from '@/components/ui';
import type { QuoteTopic } from '@/constants/quotes';
import { Fonts, Radius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type QuoteCardProps = {
  quote: string;
  author: string;
  /** Main topic, shown as a coloured tag. Saved quotes that left the library have none. */
  topic?: QuoteTopic;
  /** Small grey text in place of the topic, such as "Saved 3 Nov". */
  meta?: string;
  saved: boolean;
  onToggleSave: () => void;
  onShare: () => void;
  /** Long press copies the text. */
  onCopy: () => void;
};

/** One quote in the Explore and Saved lists. */
export const QuoteCard = memo(function QuoteCard({
  quote,
  author,
  topic,
  meta,
  saved,
  onToggleSave,
  onShare,
  onCopy,
}: QuoteCardProps) {
  const theme = useTheme();
  const accent = topic ? QUOTE_TOPIC_COLORS[topic] : theme.border;

  return (
    <Card padded={false} style={styles.card}>
      <View style={[styles.accent, { backgroundColor: accent }]} />
      <View style={styles.body}>
        <Pressable
          onLongPress={onCopy}
          delayLongPress={350}
          accessibilityRole="text"
          accessibilityLabel={`${quote} By ${author}.${topic ? ` Topic: ${quoteTopicLabel(topic)}.` : ''}`}
          accessibilityHint="Long press to copy"
          accessibilityActions={[{ name: 'longpress', label: 'Copy quote' }]}
          onAccessibilityAction={(event) => {
            if (event.nativeEvent.actionName === 'longpress') onCopy();
          }}
          style={styles.textBlock}>
          <ThemedText style={styles.quote}>“{quote}”</ThemedText>
          <View style={styles.authorRow}>
            <View style={[styles.authorRule, { backgroundColor: accent }]} />
            <ThemedText type="caption" themeColor="textSecondary" style={styles.author} numberOfLines={1}>
              {author}
            </ThemedText>
          </View>
        </Pressable>

        <View style={styles.footer}>
          <View style={styles.tag}>
            {topic ? (
              <>
                <View style={[styles.dot, { backgroundColor: accent }]} />
                <ThemedText type="micro" themeColor="textSecondary" numberOfLines={1} style={styles.tagText}>
                  {quoteTopicLabel(topic)}
                </ThemedText>
              </>
            ) : null}
            {meta ? (
              <ThemedText type="micro" themeColor="textSecondary" numberOfLines={1} style={styles.tagText}>
                {topic ? ` · ${meta}` : meta}
              </ThemedText>
            ) : null}
          </View>
          <View style={styles.actions}>
            <IconButton
              icon={saved ? 'heart' : 'heart-outline'}
              tone={saved ? 'danger' : 'default'}
              label={saved ? 'Remove from saved quotes' : 'Save quote'}
              onPress={onToggleSave}
            />
            <IconButton icon="share" label="Share quote" onPress={onShare} />
          </View>
        </View>
      </View>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accent: {
    width: 4,
    borderTopStartRadius: Radius.large,
    borderBottomStartRadius: Radius.large,
  },
  body: {
    flex: 1,
    paddingTop: Spacing.three,
    paddingStart: Spacing.three,
    paddingEnd: Spacing.two,
    paddingBottom: Spacing.one,
    gap: Spacing.two,
  },
  textBlock: {
    gap: Spacing.two,
    paddingEnd: Spacing.two,
  },
  quote: {
    ...Typography.body,
    fontFamily: Fonts?.serif,
    fontWeight: '600',
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  authorRule: {
    width: 16,
    height: 2,
    borderRadius: 1,
  },
  author: {
    flexShrink: 1,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginEnd: 6,
  },
  tagText: {
    flexShrink: 1,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
