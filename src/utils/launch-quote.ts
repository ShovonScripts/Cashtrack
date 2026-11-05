/**
 * Pure helpers for the launch quote screen. Kept free of React Native imports
 * so they run under the node test runner.
 */

/**
 * Picks a quote index for this launch. Never repeats the quote shown on the
 * previous launch (when there is more than one quote to choose from).
 *
 * @param count     number of quotes available
 * @param lastIndex index shown last time, or null when unknown
 * @param random    a number in [0, 1), injectable for tests
 */
export function pickLaunchQuoteIndex(
  count: number,
  lastIndex: number | null,
  random: number = Math.random(),
): number {
  if (count <= 0) return -1;
  if (count === 1) return 0;

  const safeRandom = Math.min(Math.max(random, 0), 0.999999);
  const hasValidLast = lastIndex !== null && Number.isInteger(lastIndex) && lastIndex >= 0 && lastIndex < count;

  if (!hasValidLast) {
    return Math.floor(safeRandom * count);
  }

  // Choose from the other (count - 1) slots, then skip over the last index.
  const pick = Math.floor(safeRandom * (count - 1));
  return pick >= lastIndex ? pick + 1 : pick;
}

/** First name only, trimmed, so the greeting stays short. Empty when unknown. */
export function getFirstName(fullName: string | undefined | null): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] ?? '';
}

/**
 * Text size role for the quote: short quotes get the hero size, longer ones
 * step down so they never need more than about six lines on a phone.
 */
export function getQuoteSizeRole(quote: string): 'hero' | 'title' | 'subtitle' {
  const length = quote.length;
  if (length <= 70) return 'hero';
  if (length <= 120) return 'title';
  return 'subtitle';
}
