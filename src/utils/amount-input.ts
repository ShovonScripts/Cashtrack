/**
 * Cleans text typed into a money field.
 *
 * Keeps digits and a single decimal point, treats a comma as the point (many
 * keyboards show a comma), and limits the fraction to `maxDecimals` digits.
 */
export function sanitizeAmountInput(text: string, maxDecimals = 2): string {
  const normalized = text.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  const firstDot = normalized.indexOf('.');
  if (firstDot === -1) return normalized;

  const whole = normalized.slice(0, firstDot);
  const fraction = normalized
    .slice(firstDot + 1)
    .replace(/\./g, '')
    .slice(0, maxDecimals);
  return `${whole}.${fraction}`;
}
