/**
 * Built-in gift categories. Free of React Native and `@/` imports so the gift
 * helpers that read it run under the node test runner.
 *
 * Every hue here keeps at least 3:1 against its tinted icon badge in light and
 * dark mode (the minimum for icons), which rules out amber, gold, orange, lime
 * and mint on a light tile.
 */
import type { GiftCategory } from '../types/gift.ts';

/** `FeatureColors` keys a gift category may use. */
export const GIFT_HUES = [
  'blue',
  'rose',
  'bronze',
  'red',
  'sky',
  'teal',
  'emerald',
  'violet',
  'crimson',
  'gray',
  'slate',
] as const;

export type GiftHue = (typeof GIFT_HUES)[number];

export function isGiftHue(value: unknown): value is GiftHue {
  return typeof value === 'string' && (GIFT_HUES as readonly string[]).includes(value);
}

/** Where gifts go when their category is deleted, or points at nothing. */
export const OTHER_GIFT_CATEGORY_ID = 'other';

/** Never change an id: stored gifts point at it. */
export const BUILT_IN_GIFT_CATEGORIES: readonly GiftCategory[] = [
  { id: 'education', name: 'Education', icon: 'school-outline', hue: 'blue' },
  { id: 'gift', name: 'Gift', icon: 'gift-outline', hue: 'rose' },
  { id: 'food', name: 'Food & Invitations', icon: 'silverware-fork-knife', hue: 'bronze' },
  { id: 'health', name: 'Health & Medical', icon: 'hospital-box-outline', hue: 'red' },
  { id: 'travel', name: 'Holiday & Travel', icon: 'airplane', hue: 'sky' },
  { id: 'transport', name: 'Transport', icon: 'bus', hue: 'teal' },
  { id: 'discount', name: 'Shopping Discount', icon: 'tag-outline', hue: 'emerald' },
  { id: 'celebration', name: 'Party & Celebration', icon: 'party-popper', hue: 'violet' },
  { id: 'anniversary', name: 'Anniversary', icon: 'heart-outline', hue: 'crimson' },
  { id: OTHER_GIFT_CATEGORY_ID, name: 'Other', icon: 'dots-horizontal-circle-outline', hue: 'gray' },
];

/** Glyph for every category the person makes. */
export const CUSTOM_GIFT_CATEGORY_ICON = 'tag-heart-outline';

/** Hues handed to new custom categories in turn. */
export const CUSTOM_GIFT_CATEGORY_HUES: readonly GiftHue[] = ['slate', 'sky', 'violet', 'teal', 'bronze', 'emerald', 'rose', 'blue'];

export function isBuiltInGiftCategory(id: string): boolean {
  return BUILT_IN_GIFT_CATEGORIES.some((category) => category.id === id);
}

/** Words that fit the chosen category, so the form never suggests school fees for a discount. */
export type GiftCategoryHint = {
  /** Label for the money field. */
  valueLabel: string;
  valueHelper: string;
  notePlaceholder: string;
  giverPlaceholder: string;
};

const DEFAULT_HINT: GiftCategoryHint = {
  valueLabel: 'Value',
  valueHelper: 'What it cost whoever paid.',
  notePlaceholder: 'e.g. What it was',
  giverPlaceholder: 'e.g. Abbu, Office, Daraz',
};

const GIFT_CATEGORY_HINTS: Readonly<Record<string, Partial<GiftCategoryHint>>> = {
  education: { notePlaceholder: 'e.g. School fees until SSC', giverPlaceholder: 'e.g. Abbu, Ammu' },
  gift: { notePlaceholder: 'e.g. A watch for my birthday', giverPlaceholder: 'e.g. My sister' },
  food: { notePlaceholder: "e.g. Dinner at Rahim's wedding", giverPlaceholder: 'e.g. Rahim' },
  health: { notePlaceholder: 'e.g. Hospital bill after my surgery', giverPlaceholder: 'e.g. My uncle' },
  travel: { notePlaceholder: "e.g. Trip to Cox's Bazar", giverPlaceholder: 'e.g. My friends' },
  transport: { notePlaceholder: 'e.g. Ride home from the airport', giverPlaceholder: 'e.g. A colleague' },
  discount: {
    valueLabel: 'Discount amount',
    valueHelper: 'The money the shop took off the price.',
    notePlaceholder: 'e.g. 20% off a shirt',
    giverPlaceholder: 'e.g. Aarong, Daraz',
  },
  celebration: { notePlaceholder: 'e.g. My birthday party', giverPlaceholder: 'e.g. My friends' },
  anniversary: { notePlaceholder: 'e.g. Anniversary dinner', giverPlaceholder: 'e.g. My partner' },
};

/** Form wording for a category; custom categories and Other get the general wording. */
export function giftCategoryHint(categoryId: string): GiftCategoryHint {
  return { ...DEFAULT_HINT, ...GIFT_CATEGORY_HINTS[categoryId] };
}
