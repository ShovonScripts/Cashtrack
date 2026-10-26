export function evaluateExpression(expr: string): number {
  let clean = expr.trim();
  while (clean.endsWith('+') || clean.endsWith('-') || clean.endsWith('.')) {
    clean = clean.slice(0, -1).trim();
  }
  if (!clean) return 0;

  const tokens = clean.match(/(?:\.\d+|\d+(?:\.\d*)?)|[+-]/g);
  if (!tokens || tokens.length === 0) return 0;

  let total = parseFloat(tokens[0]);
  if (Number.isNaN(total)) return 0;

  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const nextVal = parseFloat(tokens[i + 1]);
    if (Number.isNaN(nextVal)) break;
    if (op === '+') {
      total += nextVal;
    } else if (op === '-') {
      total -= nextVal;
    }
  }
  return Number.isFinite(total) ? Number(total.toFixed(2)) : 0;
}
