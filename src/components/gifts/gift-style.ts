import { MaterialCommunityIcons } from '@expo/vector-icons';

import { CUSTOM_GIFT_CATEGORY_ICON, isGiftHue } from '@/constants/gift-categories';
import type { GlyphName } from '@/constants/icons';
import { FeatureColors } from '@/constants/theme';
import type { ReceivedGift } from '@/types/gift';
import { formatDate } from '@/utils/expense';

/** A category's colour. Anything unknown (old or hand-edited data) reads as grey. */
export function giftHueColor(hue: string): string {
  return isGiftHue(hue) ? FeatureColors[hue] : FeatureColors.gray;
}

/** A category's glyph, falling back when a stored name is not in the icon set. */
export function giftGlyph(icon: string): GlyphName {
  return icon in MaterialCommunityIcons.glyphMap ? (icon as GlyphName) : CUSTOM_GIFT_CATEGORY_ICON;
}

/** "12 Mar 2026", or a span: "2005 – 2020" across years, "3 Mar 2026 – 9 Mar 2026" inside one. */
export function giftDateLabel(gift: Pick<ReceivedGift, 'date' | 'endDate'>): string {
  if (!gift.endDate) return formatDate(gift.date);
  const start = new Date(gift.date);
  const end = new Date(gift.endDate);
  if (start.getFullYear() !== end.getFullYear()) return `${start.getFullYear()} – ${end.getFullYear()}`;
  return `${formatDate(gift.date)} – ${formatDate(gift.endDate)}`;
}

/** Amount with "≈" in front when it is a guess. */
export function giftAmountLabel(amount: number, isEstimate: boolean, format: (value: number) => string): string {
  return `${isEstimate ? '≈ ' : ''}${format(amount)}`;
}
