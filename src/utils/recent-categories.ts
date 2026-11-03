import type { Expense } from '../types/expense';

/**
 * Most recently used categories, newest first, without repeats.
 *
 * Only categories present in `validCategories` are returned, so a deleted or
 * renamed category never shows up as a shortcut.
 */
export function getRecentCategories(
  expenses: readonly Pick<Expense, 'category' | 'date'>[],
  validCategories: readonly string[],
  limit = 4
): string[] {
  const valid = new Set(validCategories);
  const newestFirst = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const seen = new Set<string>();
  const result: string[] = [];
  for (const expense of newestFirst) {
    if (!valid.has(expense.category) || seen.has(expense.category)) continue;
    seen.add(expense.category);
    result.push(expense.category);
    if (result.length >= limit) break;
  }
  return result;
}
