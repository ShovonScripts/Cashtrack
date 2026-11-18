/**
 * Pure helpers for Gifts Received. No React Native or `@/` imports, so they
 * run under the node test runner.
 *
 * Nothing here touches expenses, income or the balance. Gifts are counted only
 * against each other: that separation is the whole point of the section.
 */
import {
  BUILT_IN_GIFT_CATEGORIES,
  CUSTOM_GIFT_CATEGORY_HUES,
  CUSTOM_GIFT_CATEGORY_ICON,
  OTHER_GIFT_CATEGORY_ID,
  isBuiltInGiftCategory,
} from '../constants/gift-categories.ts';
import type { GiftCategory, ReceivedGift } from '../types/gift.ts';

export const GIFT_LIMITS = {
  giver: 50,
  note: 200,
  gratitudeNote: 300,
  categoryName: 30,
} as const;

function randomPart(random: () => number): string {
  return random().toString(36).slice(2, 8).padEnd(6, '0');
}

export function createGiftId(now: number = Date.now(), random: () => number = Math.random): string {
  return `gift-${now.toString(36)}-${randomPart(random)}`;
}

export function createGiftCategoryId(now: number = Date.now(), random: () => number = Math.random): string {
  return `gift-cat-${now.toString(36)}-${randomPart(random)}`;
}

/** Trims and collapses inner spaces, so "  Abbu " and "Abbu" are one person. */
export function normalizeGiver(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

function giverKey(name: string): string {
  return normalizeGiver(name).toLocaleLowerCase();
}

/** Built-ins first, then the person's own, with Other always last. */
export function allGiftCategories(custom: readonly GiftCategory[]): GiftCategory[] {
  const builtIns = BUILT_IN_GIFT_CATEGORIES.filter((category) => category.id !== OTHER_GIFT_CATEGORY_ID);
  const other = BUILT_IN_GIFT_CATEGORIES.find((category) => category.id === OTHER_GIFT_CATEGORY_ID);
  return [...builtIns, ...custom, ...(other ? [other] : [])];
}

/** The category a gift belongs to. An unknown id (a deleted category) reads as Other. */
export function resolveGiftCategory(id: string, custom: readonly GiftCategory[]): GiftCategory {
  return (
    allGiftCategories(custom).find((category) => category.id === id) ??
    BUILT_IN_GIFT_CATEGORIES.find((category) => category.id === OTHER_GIFT_CATEGORY_ID)!
  );
}

/** Newest gift first; same day falls back to the one added last. */
export function sortGifts(gifts: readonly ReceivedGift[]): ReceivedGift[] {
  return [...gifts].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
}

export type GiftSummary = {
  lifetime: number;
  thisYear: number;
  count: number;
  /** Distinct named givers. */
  givers: number;
  notThanked: number;
  /** True when any amount in the total is a guess. */
  hasEstimates: boolean;
};

export function summarizeGifts(gifts: readonly ReceivedGift[], now: Date = new Date()): GiftSummary {
  const year = now.getFullYear();
  const givers = new Set<string>();
  let lifetime = 0;
  let thisYear = 0;
  let notThanked = 0;
  let hasEstimates = false;

  for (const gift of gifts) {
    lifetime += gift.amount;
    if (new Date(gift.date).getFullYear() === year) thisYear += gift.amount;
    if (!gift.thanked) notThanked += 1;
    if (gift.isEstimate) hasEstimates = true;
    const key = giverKey(gift.giver);
    if (key) givers.add(key);
  }

  return { lifetime, thisYear, count: gifts.length, givers: givers.size, notThanked, hasEstimates };
}

export type CategoryTotal = { category: GiftCategory; total: number; count: number };

/** Largest first. Categories with no gifts are left out. */
export function totalsByCategory(gifts: readonly ReceivedGift[], custom: readonly GiftCategory[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();
  for (const gift of gifts) {
    const category = resolveGiftCategory(gift.categoryId, custom);
    const entry = totals.get(category.id) ?? { category, total: 0, count: 0 };
    entry.total += gift.amount;
    entry.count += 1;
    totals.set(category.id, entry);
  }
  return [...totals.values()].sort((a, b) => b.total - a.total || a.category.name.localeCompare(b.category.name));
}

export type GiverTotal = { giver: string; total: number; count: number };

/**
 * Largest first. Names that differ only in case or spacing are one person,
 * shown with the spelling used most recently. Gifts with no giver are left out.
 */
export function totalsByGiver(gifts: readonly ReceivedGift[]): GiverTotal[] {
  const totals = new Map<string, GiverTotal & { latest: string }>();
  for (const gift of gifts) {
    const key = giverKey(gift.giver);
    if (!key) continue;
    const entry = totals.get(key) ?? { giver: normalizeGiver(gift.giver), total: 0, count: 0, latest: '' };
    entry.total += gift.amount;
    entry.count += 1;
    if (gift.date >= entry.latest) {
      entry.latest = gift.date;
      entry.giver = normalizeGiver(gift.giver);
    }
    totals.set(key, entry);
  }
  return [...totals.values()]
    .sort((a, b) => b.total - a.total || a.giver.localeCompare(b.giver))
    .map(({ giver, total, count }) => ({ giver, total, count }));
}

export type GiftYear = { year: number; total: number; gifts: ReceivedGift[] };

/** Newest year first; gifts inside a year newest first. */
export function groupGiftsByYear(gifts: readonly ReceivedGift[]): GiftYear[] {
  const years = new Map<number, GiftYear>();
  for (const gift of sortGifts(gifts)) {
    const year = new Date(gift.date).getFullYear();
    const entry = years.get(year) ?? { year, total: 0, gifts: [] };
    entry.total += gift.amount;
    entry.gifts.push(gift);
    years.set(year, entry);
  }
  return [...years.values()].sort((a, b) => b.year - a.year);
}

/** Distinct givers, most recent first, for one-tap filling in the form. */
export function recentGivers(gifts: readonly ReceivedGift[], limit = 6): string[] {
  const seen = new Set<string>();
  const names: string[] = [];
  for (const gift of sortGifts(gifts)) {
    const key = giverKey(gift.giver);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    names.push(normalizeGiver(gift.giver));
    if (names.length === limit) break;
  }
  return names;
}

export type GiftFormInput = {
  amountText: string;
  date: Date;
  coversPeriod: boolean;
  endDate: Date;
};

export type GiftFormProblem = { field: 'amount' | 'period'; message: string };

/** The first problem and the field it belongs to, or null when the form can be saved. */
export function validateGiftForm(input: GiftFormInput): GiftFormProblem | null {
  const amount = input.amountText.trim() === '' ? Number.NaN : Number(input.amountText);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { field: 'amount', message: 'Enter an amount greater than zero. A best guess is fine.' };
  }
  if (input.coversPeriod && startOfDay(input.endDate) < startOfDay(input.date)) {
    return { field: 'period', message: 'The end date cannot be before the start date.' };
  }
  return null;
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function sameName(a: string, b: string): boolean {
  return a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();
}

export type CategoryChange = { ok: true; categories: GiftCategory[]; category: GiftCategory } | { ok: false; error: string };

function checkCategoryName(name: string, custom: readonly GiftCategory[], exceptId?: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return 'Give the category a name.';
  if (trimmed.length > GIFT_LIMITS.categoryName) return `Keep the name to ${GIFT_LIMITS.categoryName} characters.`;
  const clash = allGiftCategories(custom).some((category) => category.id !== exceptId && sameName(category.name, trimmed));
  return clash ? 'There is already a category with that name.' : null;
}

/** Adds a custom category, taking the next hue in turn. */
export function addGiftCategory(
  custom: readonly GiftCategory[],
  name: string,
  id: string = createGiftCategoryId(),
): CategoryChange {
  const error = checkCategoryName(name, custom);
  if (error) return { ok: false, error };
  const category: GiftCategory = {
    id,
    name: name.trim(),
    icon: CUSTOM_GIFT_CATEGORY_ICON,
    hue: CUSTOM_GIFT_CATEGORY_HUES[custom.length % CUSTOM_GIFT_CATEGORY_HUES.length],
  };
  return { ok: true, categories: [...custom, category], category };
}

/** Renames a custom category. Built-in ones cannot be renamed. */
export function renameGiftCategory(custom: readonly GiftCategory[], id: string, name: string): CategoryChange {
  if (isBuiltInGiftCategory(id)) return { ok: false, error: 'Built-in categories cannot be renamed.' };
  const current = custom.find((category) => category.id === id);
  if (!current) return { ok: false, error: 'That category no longer exists.' };
  const error = checkCategoryName(name, custom, id);
  if (error) return { ok: false, error };
  const category = { ...current, name: name.trim() };
  return { ok: true, categories: custom.map((item) => (item.id === id ? category : item)), category };
}

/** Gifts in a category that is being deleted move to Other, so none are lost. */
export function moveGiftsToOther(gifts: readonly ReceivedGift[], categoryId: string, now: string): ReceivedGift[] {
  return gifts.map((gift) =>
    gift.categoryId === categoryId ? { ...gift, categoryId: OTHER_GIFT_CATEGORY_ID, updatedAt: now } : gift,
  );
}
