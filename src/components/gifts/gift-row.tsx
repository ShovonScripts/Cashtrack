import { Pressable, StyleSheet, View } from 'react-native';

import { giftAmountLabel, giftDateLabel, giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { Badge, Icon } from '@/components/ui';
import { MinTouchTarget, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark } from '@/hooks/use-theme';
import type { GiftCategory, ReceivedGift } from '@/types/gift';

type GiftRowProps = {
  gift: ReceivedGift;
  category: GiftCategory;
  formatAmount: (value: number) => string;
  onPress: () => void;
};

/** One gift in the list: what it was, who paid, when, and its value. */
export function GiftRow({ gift, category, formatAmount, onPress }: GiftRowProps) {
  const isDark = useIsDark();
  const hue = giftHueColor(category.hue);
  const title = gift.note || category.name;
  const dateLabel = giftDateLabel(gift);
  const amount = giftAmountLabel(gift.amount, gift.isEstimate, formatAmount);
  const subtitle = [gift.giver ? `From ${gift.giver}` : null, dateLabel].filter(Boolean).join(' · ');

  const spoken = [
    title,
    `${gift.isEstimate ? 'about ' : ''}${formatAmount(gift.amount)}`,
    gift.giver ? `from ${gift.giver}` : null,
    dateLabel,
    gift.thanked ? 'thanked' : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={spoken}
      accessibilityHint="Opens the gift to edit it"
      style={({ pressed }) => [styles.row, pressed && PressFeedback]}>
      <View style={[styles.badge, { backgroundColor: withAlpha(hue, isDark ? 0.18 : 0.12) }]}>
        <Icon name={giftGlyph(category.icon)} size="md" color={hue} />
      </View>
      <View style={styles.copy}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {title}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <View style={styles.end}>
        <ThemedText type="smallBold">{amount}</ThemedText>
        {gift.thanked ? <Badge label="Thanked" tone="success" icon="hand-heart-outline" /> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  badge: {
    width: 40,
    height: 40,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: Spacing.half },
  end: { alignItems: 'flex-end', gap: Spacing.one },
});
