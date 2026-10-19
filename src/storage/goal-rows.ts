import type { MoneyGoal } from '@/types/goal';
import { StorageParseError } from './storage-errors.ts';

/**
 * Maps a JSON-decoded web goal entry onto a `MoneyGoal`, filling in defaults for
 * fields that older stored records may not have. Throws `StorageParseError` for
 * entries that are not plain objects so an invalid payload surfaces as an error
 * instead of silently collapsing to an empty list.
 */
export function mapGoalRow(row: unknown): MoneyGoal {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) {
    throw new StorageParseError('Stored goals entry is not an object');
  }

  const goal = row as Partial<MoneyGoal>;
  return {
    ...(row as MoneyGoal),
    potType: goal.potType ?? 'general',
    allocationType: goal.allocationType ?? 'manual',
    allocationPercent: goal.allocationPercent ?? null,
    icon: goal.icon ?? 'piggy-bank',
  };
}
