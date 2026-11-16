/**
 * Pure helpers for the launch quote screen. Kept free of React Native imports
 * so they run under the node test runner.
 */

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
