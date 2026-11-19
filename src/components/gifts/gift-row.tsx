import { Pressable, StyleSheet, View } from 'react-native';

import { giftAmountLabel, giftDateLabel, giftGlyph, giftHueColor } from '@/components/gifts/gift-style';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/ui';
import { MinTouchTarget, PressFeedback, Radius, Spacing, withAlpha } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { GiftCategory, ReceivedGift } from '@/types/gift';

type GiftRowProps = {
  gift: ReceivedGift;
  category: GiftCategory;
  formatAmount: (value: number) => string;
  onPress: () => void;
  /** Marks the gift thanked, or takes the mark off again. */
  onToggleThanked: () => void;
};

/**
 * One gift: what it was, who paid, when, its value, and a heart to say you
 * have thanked them. The heart is its own button, so thanking someone never
 * means opening and saving the whole form.
 */
export function GiftRow({ gift, category, formatAmount, onPress, onToggleThanked }: GiftRowProps) {
  const theme = useTheme();
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
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={spoken}
        accessibilityHint="Opens the gift to edit it"
        style={({ pressed }) => [styles.main, pressed && PressFeedback]}>
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
        <ThemedText type="smallBold" style={styles.amount}>
          {amount}
        </ThemedText>
      </Pressable>

      <Pressable
        onPress={onToggleThanked}
        accessibilityRole="switch"
        accessibilityLabel={gift.giver ? `Thanked ${gift.giver}` : 'Thanked'}
        accessibilityHint={gift.thanked ? 'Takes the thank-you mark off' : 'Marks that you have said thank you'}
        accessibilityState={{ checked: gift.thanked }}
        hitSlop={4}
        style={({ pressed }) => [
          styles.thank,
          gift.thanked
            ? { backgroundColor: withAlpha(theme.success, isDark ? 0.2 : 0.12), borderColor: theme.success }
            : { borderColor: theme.border },
          pressed && PressFeedback,
        ]}>
        <Icon
          name={gift.thanked ? 'hand-heart' : 'hand-heart-outline'}
          size="md"
          color={gift.thanked ? theme.success : theme.textSecondary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: Spacing.three,
  },
  main: {
    flex: 1,
    minHeight: MinTouchTarget + Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingLeft: Spacing.three,
    paddingRight: Spacing.two,
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
  amount: { textAlign: 'right' },
  // A real 44 dp target, round so it reads as a toggle rather than a row action.
  thank: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
