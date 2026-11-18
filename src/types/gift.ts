/**
 * Gifts Received: value that reached you because someone else paid for it —
 * a present, school fees your parents covered, a meal at an invitation, a
 * hospital bill someone settled, or a shop's discount.
 *
 * This is kept completely apart from your money. A gift is never income, never
 * an expense, and never part of your balance, budgets or reports.
 */

/** A gift category. Separate from expense categories, so the two lists never mix. */
export type GiftCategory = {
  /** Stable id. Gifts point at it, so a rename never orphans them. */
  id: string;
  name: string;
  /** MaterialCommunityIcons glyph name. */
  icon: string;
  /** A `GiftHue` key; the screen turns it into a colour. */
  hue: string;
};

export type ReceivedGift = {
  id: string;
  /** What it cost the person who paid, in your currency. A best guess is fine. */
  amount: number;
  /** True when the amount is a guess (a meal, years of school fees). */
  isEstimate: boolean;
  categoryId: string;
  /** Who paid. Empty when unknown. */
  giver: string;
  /** ISO date-time: the day of the gift, or the first day of a period. */
  date: string;
  /** ISO date-time of the last day, when the gift covered a period; otherwise null. */
  endDate: string | null;
  /** What it was, e.g. "School fees until SSC". */
  note: string;
  /** Whether you have thanked the person. */
  thanked: boolean;
  /** Why you are grateful, in your own words. */
  gratitudeNote: string;
  createdAt: string;
  updatedAt: string;
};

/** What the add and edit forms produce. */
export type GiftDraft = Omit<ReceivedGift, 'id' | 'createdAt' | 'updatedAt'>;
