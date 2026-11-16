import { Pressable, StyleSheet, View } from 'react-native';

import { Card, CardDivider } from '@/components/card';
import { ThemedText } from '@/components/themed-text';
import { Chip, Sheet, SwitchRow } from '@/components/ui';
import { getQuotePool, QUOTE_TOPICS } from '@/constants/quotes';
import { MinTouchTarget, Spacing } from '@/constants/theme';
import { usePreferences } from '@/context/expense-context';
import { notify } from '@/utils/confirm';
import { triggerHaptic } from '@/utils/motion';
import { isTopicChosen, toggleTopicChoice } from '@/utils/quote-browse';
import { requestQuoteNotificationPermissionsAsync } from '@/utils/quote-notifications';

/** Below this many quotes the daily quote starts repeating within about a week. */
const FEW_QUOTES = 10;

type QuoteSettingsSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** Every quote setting in one place: daily topics, opening screen, morning notification. */
export function QuoteSettingsSheet({ visible, onClose }: QuoteSettingsSheetProps) {
  const {
    quoteTopics,
    setQuoteTopics,
    showLaunchQuote,
    setShowLaunchQuote,
    enableDailyQuotes,
    setEnableDailyQuotes,
  } = usePreferences();

  const poolSize = getQuotePool(quoteTopics).length;
  const allTopics = quoteTopics.length === 0;

  const onTopicPress = (topic: (typeof QUOTE_TOPICS)[number]['key']) => {
    const next = toggleTopicChoice(quoteTopics, topic);
    if (!next) {
      notify('Keep one topic', 'Your daily quote needs at least one topic to choose from.');
      return;
    }
    triggerHaptic();
    setQuoteTopics(next);
  };

  const onMorningQuote = async (on: boolean) => {
    triggerHaptic();
    if (on && !(await requestQuoteNotificationPermissionsAsync())) {
      notify('Notifications are off', 'Allow notifications for CashTrack in your phone’s Settings to get the morning quote.');
      return;
    }
    setEnableDailyQuotes(on);
  };

  return (
    <Sheet visible={visible} onClose={onClose} title="Quote settings">
      <View style={styles.group}>
        <ThemedText type="smallBold">Daily quote topics</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          Your quote of the day, on the opening screen, Home and the morning notification, comes from these topics.
        </ThemedText>
        <View style={styles.chips}>
          {QUOTE_TOPICS.map((topic) => (
            <Chip
              key={topic.key}
              label={topic.label}
              selected={isTopicChosen(quoteTopics, topic.key)}
              onPress={() => onTopicPress(topic.key)}
            />
          ))}
        </View>
        <View style={styles.summaryRow}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.summaryText}>
            {allTopics ? 'All topics' : `${quoteTopics.length} of ${QUOTE_TOPICS.length} topics`} · {poolSize}{' '}
            {poolSize === 1 ? 'quote' : 'quotes'}
          </ThemedText>
          {!allTopics ? (
            <Pressable
              onPress={() => {
                triggerHaptic();
                setQuoteTopics([]);
              }}
              accessibilityRole="button"
              hitSlop={4}
              style={({ pressed }) => [styles.reset, pressed && styles.pressed]}>
              <ThemedText type="caption" themeColor="accent" style={styles.resetText}>
                Use all topics
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        {poolSize < FEW_QUOTES ? (
          <ThemedText type="caption" themeColor="warning">
            Only {poolSize} {poolSize === 1 ? 'quote' : 'quotes'} in these topics, so the same ones come back sooner.
            Add a topic for more variety.
          </ThemedText>
        ) : null}
      </View>

      <Card padded={false}>
        <SwitchRow
          label="Quote when the app opens"
          description="Today’s quote, with your time-left countdown"
          value={showLaunchQuote}
          onValueChange={(on) => {
            triggerHaptic();
            setShowLaunchQuote(on);
          }}
        />
        <CardDivider />
        <SwitchRow
          label="Morning quote"
          description="Today’s quote as a notification at 8:00 AM"
          value={enableDailyQuotes}
          onValueChange={(on) => void onMorningQuote(on)}
        />
      </Card>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  summaryText: { flexShrink: 1 },
  reset: { minHeight: MinTouchTarget, justifyContent: 'center' },
  resetText: { fontWeight: '700' },
  pressed: { opacity: 0.6 },
});
