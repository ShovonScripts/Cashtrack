import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/card';
import { giftAmountLabel, giftDateLabel, giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { Button, Icon } from '@/components/ui';
import { Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { GiftCategory, ReceivedGift } from '@/types/gift';

type GiftRememberCardProps = {
  gift: ReceivedGift;
  category: GiftCategory;
  formatAmount: (value: number) => string;
  onOpen: () => void;
};

/**
 * One gift brought back each day. Gratitude fades when the list just grows;
 * looking at a single gift, and what it meant, is what keeps it alive. With
 * no note yet, it asks for one instead.
 */
export function GiftRememberCard({ gift, category, formatAmount, onOpen }: GiftRememberCardProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const hue = giftHueColor(category.hue);
  const note = gift.gratitudeNote.trim();
  const title = gift.note || category.name;
  const meta = [gift.giver ? `From ${gift.giver}` : null, giftDateLabel(gift), giftAmountLabel(gift.amount, gift.isEstimate, formatAmount)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card style={[styles.card, { borderLeftColor: hue }]}>
      <View style={styles.eyebrow}>
        <Icon name="lightbulb-on-outline" size="sm" color={theme.textSecondary} />
        <ThemedText type="micro" themeColor="textSecondary" style={styles.eyebrowText}>
          TO REMEMBER TODAY
        </ThemedText>
      </View>

      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: withAlpha(hue, isDark ? 0.18 : 0.12) }]}>
          <Icon name={giftGlyph(category.icon)} size="md" color={hue} />
        </View>
        <View style={styles.copy}>
          <ThemedText type="defaultBold" numberOfLines={2}>
            {title}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
            {meta}
          </ThemedText>
        </View>
      </View>

      {note ? (
        <View style={[styles.quote, { backgroundColor: theme.cardMuted }]}>
          <Icon name="format-quote-open" size="sm" color={hue} />
          <ThemedText type="small" style={styles.quoteText}>
            {note}
          </ThemedText>
        </View>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            Why are you grateful for this one? A line now is something to read again later.
          </ThemedText>
          <Button label="Write why" variant="secondary" onPress={onOpen} />
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  // The gift's own colour down the edge, the one splash on an otherwise calm card.
  card: { gap: Spacing.three, borderLeftWidth: 4 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  eyebrowText: { letterSpacing: 1.2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  badge: { width: 40, height: 40, borderRadius: Radius.medium, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: Spacing.half },
  quote: { flexDirection: 'row', gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.medium },
  quoteText: { flex: 1, fontStyle: 'italic' },
});
