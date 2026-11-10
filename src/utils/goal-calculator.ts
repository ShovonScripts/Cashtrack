import type { GoalFrequency } from '@/types/goal';
import { roundMoney } from './money.ts';

export interface GoalCalculationResult {
  targetAmount: number;
  contributedAmount: number;
  remainingAmount: number;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  expectedProgress: number;
  actualProgress: number;
  aheadBehindAmount: number; // positive = ahead, negative = behind
  isCompleted: boolean;
  dailyRequired: number;
  weeklyRequired: number;
  monthlyRequired: number;
  frequencyRequired: number;
}

function getCalendarMonths(start: Date, deadline: Date): number {
  const years = deadline.getFullYear() - start.getFullYear();
  const months = deadline.getMonth() - start.getMonth();
  const totalMonths = years * 12 + months;
  const dayDiff = (deadline.getDate() - start.getDate()) / 30;
  return Math.max(1, Math.round(totalMonths + dayDiff));
}

function getFrequencyPeriods(frequency: GoalFrequency, start: Date, deadline: Date, totalDays: number): number {
  const months = getCalendarMonths(start, deadline);
  switch (frequency) {
    case 'daily':
      return Math.max(1, totalDays);
    case 'weekly':
      return Math.max(1, Math.ceil(totalDays / 7));
    case 'monthly':
      return Math.max(1, months);
    case 'quarterly':
      return Math.max(1, Math.ceil(months / 3));
    case 'half-yearly':
      return Math.max(1, Math.ceil(months / 6));
    case 'yearly':
      return Math.max(1, Math.ceil(months / 12));
    default:
      return Math.max(1, months);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole calendar months from `start` to `end`; a month counts only once it has fully passed. */
function getFullMonths(start: Date, end: Date): number {
  let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  const anniversary = new Date(start);
  anniversary.setMonth(start.getMonth() + months);
  if (anniversary.getTime() > end.getTime()) months -= 1;
  return Math.max(0, months);
}

/**
 * Saving periods that have fully passed since the start. A pot that is an hour
 * old has completed none, so the first period's share is never skipped.
 */
function getCompletedPeriods(frequency: GoalFrequency, start: Date, today: Date): number {
  const elapsedMs = today.getTime() - start.getTime();
  if (elapsedMs <= 0) return 0;
  switch (frequency) {
    case 'daily':
      return Math.floor(elapsedMs / DAY_MS);
    case 'weekly':
      return Math.floor(elapsedMs / (7 * DAY_MS));
    case 'quarterly':
      return Math.floor(getFullMonths(start, today) / 3);
    case 'half-yearly':
      return Math.floor(getFullMonths(start, today) / 6);
    case 'yearly':
      return Math.floor(getFullMonths(start, today) / 12);
    case 'monthly':
    default:
      return getFullMonths(start, today);
  }
}

export function calculateGoalProgress({
  targetAmount,
  startDate,
  deadlineDate,
  currentAmount,
  frequency,
  today = new Date(),
}: {
  targetAmount: number;
  startDate: string;
  deadlineDate?: string | null;
  currentAmount: number;
  frequency: GoalFrequency;
  today?: Date;
}): GoalCalculationResult {
  const start = new Date(startDate);
  const hasDeadline = Boolean(deadlineDate);
  const deadline = hasDeadline ? new Date(deadlineDate!) : new Date(start.getTime() + 10 * 365 * 24 * 60 * 60 * 1000);

  const totalMs = Math.max(0, deadline.getTime() - start.getTime());
  const elapsedMs = Math.max(0, Math.min(totalMs, today.getTime() - start.getTime()));

  const totalDays = hasDeadline
    ? Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)) + 1)
    : 0;
  const elapsedDays = hasDeadline
    ? Math.max(0, Math.min(totalDays, Math.round(elapsedMs / (1000 * 60 * 60 * 24))))
    : 0;
  const remainingDays = !hasDeadline
    ? 0
    : today.getTime() >= deadline.getTime()
      ? 0
      : Math.max(0, totalDays - elapsedDays);

  const timeFraction = !hasDeadline ? 0 : Math.min(1, Math.max(0, elapsedDays / totalDays));
  const roundedTarget = roundMoney(targetAmount);
  const roundedCurrent = roundMoney(currentAmount);
  const hasTarget = roundedTarget > 0;
  const expectedProgress = hasTarget ? roundMoney(roundedTarget * timeFraction) : 0;
  const actualProgress = roundMoney(Math.max(0, roundedCurrent));
  const remainingAmount = hasTarget ? roundMoney(Math.max(0, roundedTarget - actualProgress)) : 0;
  const aheadBehindAmount = hasTarget && hasDeadline ? roundMoney(actualProgress - expectedProgress) : 0;
  const isCompleted = hasTarget && actualProgress >= roundedTarget;

  const totalPeriods = getFrequencyPeriods(frequency, start, deadline, totalDays);
  const elapsedPeriods = Math.min(totalPeriods, getCompletedPeriods(frequency, start, today));
  const remainingPeriods = Math.max(1, totalPeriods - elapsedPeriods);

  // Requirements calculations
  let dailyRequired = 0;
  let weeklyRequired = 0;
  let monthlyRequired = 0;
  let frequencyRequired = 0;

  if (!hasDeadline) {
    dailyRequired = 0;
    weeklyRequired = 0;
    monthlyRequired = 0;
    frequencyRequired = 0;
  } else if (isCompleted || remainingAmount === 0) {
    dailyRequired = 0;
    weeklyRequired = 0;
    monthlyRequired = 0;
    frequencyRequired = 0;
  } else if (remainingDays === 0) {
    dailyRequired = remainingAmount;
    weeklyRequired = remainingAmount;
    monthlyRequired = remainingAmount;
    frequencyRequired = remainingAmount;
  } else {
    dailyRequired = roundMoney(remainingAmount / remainingDays);
    weeklyRequired = roundMoney(Math.min(remainingAmount, dailyRequired * 7));
    monthlyRequired = roundMoney(Math.min(remainingAmount, dailyRequired * (365.25 / 12)));
    frequencyRequired = roundMoney(Math.min(remainingAmount, remainingAmount / remainingPeriods));
  }

  return {
    targetAmount: roundedTarget,
    contributedAmount: actualProgress,
    remainingAmount,
    totalDays,
    elapsedDays,
    remainingDays,
    expectedProgress,
    actualProgress,
    aheadBehindAmount,
    isCompleted,
    dailyRequired,
    weeklyRequired,
    monthlyRequired,
    frequencyRequired,
  };
}
