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
