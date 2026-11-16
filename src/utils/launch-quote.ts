/**
 * Pure helpers for the launch quote screen. Kept free of React Native imports
 * so they run under the node test runner.
 */

/** First name only, trimmed, so the greeting stays short. Empty when unknown. */
export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/** Screens shorter than this (in dp) use the compact launch layout. */
export const COMPACT_LAUNCH_HEIGHT = 820;

const SIZE_ROLES = ['hero', 'title', 'subtitle', 'body'] as const;

/**
 * Text size role for the quote: short quotes get the hero size, longer ones
 * step down so they never need more than about six lines on a phone. On a
 * short phone (`compact`) every quote goes one step smaller still.
 */
export function getQuoteSizeRole(quote: string, compact = false): (typeof SIZE_ROLES)[number] {
  const length = quote.length;
  const step = length <= 70 ? 0 : length <= 120 ? 1 : 2;
  return SIZE_ROLES[step + (compact ? 1 : 0)];
}
