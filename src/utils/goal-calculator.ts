import type { GoalFrequency } from '@/types/goal';

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

function getFrequencyPeriods(frequency: GoalFrequency, totalDays: number): number {
  switch (frequency) {
    case 'daily':
      return Math.max(1, totalDays);
    case 'weekly':
      return Math.max(1, Math.ceil(totalDays / 7));
    case 'monthly':
      return Math.max(1, Math.round(totalDays / 30.4375));
    case 'quarterly':
      return Math.max(1, Math.round(totalDays / 91.3125));
    case 'half-yearly':
      return Math.max(1, Math.round(totalDays / 182.625));
    case 'yearly':
      return Math.max(1, Math.round(totalDays / 365.25));
    default:
      return Math.max(1, Math.round(totalDays / 30.4375));
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
  deadlineDate: string;
  currentAmount: number;
  frequency: GoalFrequency;
  today?: Date;
}): GoalCalculationResult {
  const start = new Date(startDate);
  const deadline = new Date(deadlineDate);

  const totalMs = Math.max(1, deadline.getTime() - start.getTime());
  const elapsedMs = Math.max(0, Math.min(totalMs, today.getTime() - start.getTime()));

  const totalDays = Math.max(1, Math.ceil(totalMs / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24))));
  const remainingDays = Math.max(0, totalDays - elapsedDays);

  const timeFraction = Math.min(1, Math.max(0, elapsedDays / totalDays));
  const expectedProgress = targetAmount * timeFraction;
  const actualProgress = Math.max(0, currentAmount);
  const remainingAmount = Math.max(0, targetAmount - actualProgress);
  const aheadBehindAmount = actualProgress - expectedProgress;
  const isCompleted = actualProgress >= targetAmount;

  const totalPeriods = getFrequencyPeriods(frequency, totalDays);
  const elapsedPeriods = Math.min(totalPeriods, getFrequencyPeriods(frequency, elapsedDays));
  const remainingPeriods = Math.max(1, totalPeriods - elapsedPeriods);

  const frequencyRequired = remainingAmount / remainingPeriods;
  const dailyRequired = remainingAmount / Math.max(1, remainingDays);
  const weeklyRequired = dailyRequired * 7;
  const monthlyRequired = dailyRequired * 30.4375;

  return {
    targetAmount,
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
