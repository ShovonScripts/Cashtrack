export type CategoryMoveDirection = 'up' | 'down';

/**
 * Applies a saved category order while keeping every known category. Names in
 * the saved order come first; anything new is appended in its default position.
 */
export function applyCategoryOrder<T extends string>(
  defaultCategories: readonly T[],
  storedOrder: readonly string[] | undefined,
): T[] {
  const available = new Set<string>(defaultCategories);
  const ordered: T[] = [];
  const seen = new Set<string>();

  for (const name of storedOrder ?? []) {
    if (available.has(name) && !seen.has(name)) {
      ordered.push(name as T);
      seen.add(name);
    }
  }

  for (const name of defaultCategories) {
    if (!seen.has(name)) {
      ordered.push(name);
      seen.add(name);
    }
  }

  return ordered;
}

export function moveCategoryInOrder<T extends string>(
  categories: T[],
  category: T,
  direction: CategoryMoveDirection,
): T[] {
  const index = categories.indexOf(category);
  const target = direction === 'up' ? index - 1 : index + 1;

  if (index < 0 || target < 0 || target >= categories.length) {
    return categories;
  }

  const next = [...categories];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
