import type { AllocationType, GoalContribution, GoalFrequency, PotType } from '@/types/goal';
import { potMeta, toPotChoice } from './goal-form.ts';

/** What the card and detail page need to describe a pot. */
export type PotDisplayInput = {
  targetAmount: number;
  contributedAmount: number;
  aheadBehindAmount: number;
  isCompleted: boolean;
  allocationType: AllocationType;
  allocationPercent: number | null;
  deadlineDate?: string | null;
  potType: PotType;
};

export type PotStatusKind = 'completed' | 'open-ended' | 'overdue' | 'behind' | 'on-track';
export type PotStatusTone = 'success' | 'neutral' | 'danger' | 'warning' | 'accent';

export const FREQUENCY_UNIT: Record<GoalFrequency, string> = {
  daily: 'day',
  weekly: 'week',
  monthly: 'month',
  quarterly: 'quarter',
  'half-yearly': 'half-year',
  yearly: 'year',
};

/** True when the pot has no target or no deadline, so there is no pace to keep. */
export function isOpenEndedPot(pot: Pick<PotDisplayInput, 'targetAmount' | 'allocationType' | 'deadlineDate'>): boolean {
  return pot.allocationType === 'flexible' || pot.targetAmount <= 0 || !pot.deadlineDate;
}

/** Whole days past the deadline, or 0 when it has not passed (or the pot is done). */
export function overdueDays(pot: Pick<PotDisplayInput, 'deadlineDate' | 'isCompleted'>, now: Date): number {
  if (!pot.deadlineDate || pot.isCompleted) return 0;
  const late = now.getTime() - new Date(pot.deadlineDate).getTime();
  return late > 0 ? Math.max(1, Math.ceil(late / 86_400_000)) : 0;
}

/** One status per pot, used the same way on the list card and the detail page. */
export function potStatus(pot: PotDisplayInput, now: Date): { kind: PotStatusKind; label: string; tone: PotStatusTone } {
  if (pot.isCompleted) return { kind: 'completed', label: 'Completed', tone: 'success' };
  if (isOpenEndedPot(pot)) return { kind: 'open-ended', label: 'Open-ended', tone: 'neutral' };
  if (overdueDays(pot, now) > 0) return { kind: 'overdue', label: 'Overdue', tone: 'danger' };
  if (pot.aheadBehindAmount < 0) return { kind: 'behind', label: 'Behind', tone: 'warning' };
  return { kind: 'on-track', label: 'On track', tone: 'accent' };
}

/** "Auto-save 10%", "Flexible" or "Manual": the same words the form uses. */
export function ruleLabel(pot: Pick<PotDisplayInput, 'allocationType' | 'allocationPercent'>): string {
  if (pot.allocationType === 'percentage') return pot.allocationPercent ? `Auto-save ${pot.allocationPercent}%` : 'Auto-save';
  if (pot.allocationType === 'flexible') return 'Flexible';
  return 'Manual';
}

/** The outline glyph the pot type picker shows, so card and form match. */
export function potGlyph(potType: PotType): string {
  return potMeta(toPotChoice(potType)).glyph;
}

export function potTypeLabel(potType: PotType): string {
  return potMeta(toPotChoice(potType)).label;
}

const STATUS_ORDER: Record<PotStatusKind, number> = {
  overdue: 0,
  behind: 1,
  'on-track': 2,
  'open-ended': 3,
  completed: 4,
};

/**
 * Pots that need attention first: overdue, then behind, on track, open-ended,
 * completed. Within a group the nearest deadline comes first; the input order
 * (newest first) breaks remaining ties.
 */
export function sortPotsForList<T extends PotDisplayInput>(pots: readonly T[], now: Date): T[] {
  return pots
    .map((pot, index) => ({ pot, index, rank: STATUS_ORDER[potStatus(pot, now).kind] }))
    .sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      const aDue = a.pot.deadlineDate ? new Date(a.pot.deadlineDate).getTime() : Infinity;
      const bDue = b.pot.deadlineDate ? new Date(b.pot.deadlineDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return a.index - b.index;
    })
    .map((entry) => entry.pot);
}

/** The next 25/50/75/100% mark not yet reached, or null when the pot has no target or is full. */
export function nextMilestone(contributed: number, target: number): { percent: number; amount: number } | null {
  if (target <= 0) return null;
  for (const percent of [25, 50, 75, 100]) {
    const amount = (target * percent) / 100;
    if (contributed < amount) return { percent, amount };
  }
  return null;
}

/** Oldest first, each with the pot's total after it was added. */
export function runningTotals(contributions: readonly GoalContribution[]): { contribution: GoalContribution; total: number }[] {
  const sorted = [...contributions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let total = 0;
  return sorted.map((contribution) => {
    total = Math.round((total + contribution.amount) * 100) / 100;
    return { contribution, total };
  });
}

/** Auto-save entries belong to an income; they change when that income changes. */
export function isAutoSaveContribution(contribution: Pick<GoalContribution, 'sourceIncomeId'>): boolean {
  return Boolean(contribution.sourceIncomeId);
}
