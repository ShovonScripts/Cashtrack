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
      return Math.max(1, Math.round(months / 12));
    default:
      return Math.max(1, months);
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

  const totalDays = Math.max(1, Math.round(totalMs / (1000 * 60 * 60 * 24)) + 1);
  const elapsedDays = Math.max(0, Math.min(totalDays, Math.round(elapsedMs / (1000 * 60 * 60 * 24))));
  const remainingDays = !hasDeadline ? 999999 : today.getTime() >= deadline.getTime() ? 0 : Math.max(0, totalDays - elapsedDays);

  const timeFraction = !hasDeadline ? 0 : Math.min(1, Math.max(0, elapsedDays / totalDays));
  const expectedProgress = targetAmount * timeFraction;
  const actualProgress = Math.max(0, currentAmount);
  const remainingAmount = Math.max(0, targetAmount - actualProgress);
  const aheadBehindAmount = !hasDeadline ? actualProgress : (actualProgress - expectedProgress);
  const isCompleted = actualProgress >= targetAmount;

  const totalPeriods = getFrequencyPeriods(frequency, start, deadline, totalDays);
  const elapsedPeriods = today <= start ? 0 : Math.min(totalPeriods, getFrequencyPeriods(frequency, start, today, elapsedDays));
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
    dailyRequired = remainingAmount / remainingDays;
    weeklyRequired = Math.min(remainingAmount, dailyRequired * 7);
    monthlyRequired = Math.min(remainingAmount, dailyRequired * (365.25 / 12));
    frequencyRequired = Math.min(remainingAmount, remainingAmount / remainingPeriods);
  }

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
