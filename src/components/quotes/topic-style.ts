import { FeatureColors } from '@/constants/theme';
import { QUOTE_TOPICS, type QuoteTopic } from '@/constants/quotes';

/** One hue per topic, used for the card's side bar and the topic dot. */
export const QUOTE_TOPIC_COLORS: Record<QuoteTopic, string> = {
  saving: FeatureColors.emerald,
  spending: FeatureColors.amber,
  investing: FeatureColors.indigo,
  debt: FeatureColors.crimson,
  earning: FeatureColors.blue,
  mindset: FeatureColors.violet,
  giving: FeatureColors.coral,
  contentment: FeatureColors.teal,
};

const LABELS = new Map(QUOTE_TOPICS.map((topic) => [topic.key, topic.label]));

export function quoteTopicLabel(topic: QuoteTopic): string {
  return LABELS.get(topic) ?? topic;
}
