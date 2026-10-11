/**
 * Safe alpha channel helper for hex colors (#RGB, #RRGGBB, #RRGGBBAA) or rgba() strings.
 */
export function withAlpha(color: string, opacity: number): string {
  if (!color || typeof color !== 'string') return color;

  const alpha = Math.min(Math.max(opacity, 0), 1);

  if (color.startsWith('#')) {
    let hex = color.slice(1).trim();
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    if (hex.length === 8) {
      hex = hex.slice(0, 6);
    }
    if (hex.length === 6) {
      const alphaHex = Math.round(alpha * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase();
      return `#${hex}${alphaHex}`;
    }
  }

  if (color.startsWith('rgb')) {
    const match = color.match(/\d+(\.\d+)?/g);
    if (match && match.length >= 3) {
      return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
    }
  }

  return color;
}
