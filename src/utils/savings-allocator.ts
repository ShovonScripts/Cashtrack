import type { GoalContribution, MoneyGoal } from '../types/goal.ts';
import type { IncomeRecord } from '../types/income.ts';

export type AllocationResult = {
  goalId: string;
  amount: number;
  note: string;
};

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Splits an income across percentage-based pots.
 *
 * Contributions are capped by the pot's remaining target and by the income
 * available, so auto-save can never allocate more than the money received or
 * push a pot past its goal.
 */
export function calculateIncomeAllocations(
  income: IncomeRecord,
  goals: readonly MoneyGoal[],
  contributions: readonly GoalContribution[] = []
): AllocationResult[] {
  const contributedByGoal = new Map<string, number>();
  for (const contribution of contributions) {
    contributedByGoal.set(
      contribution.goalId,
      roundCurrency((contributedByGoal.get(contribution.goalId) ?? 0) + contribution.amount)
    );
  }

  const activeGoals = goals
    .filter(
      (g) =>
        g.status === 'active' &&
        g.allocationType === 'percentage' &&
        typeof g.allocationPercent === 'number' &&
        g.allocationPercent > 0
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));

  const results: AllocationResult[] = [];
  let remainingIncome = roundCurrency(income.amount);

  for (const goal of activeGoals) {
    if (remainingIncome <= 0) break;

    const contributed = contributedByGoal.get(goal.id) ?? 0;
    const remainingTarget = roundCurrency(goal.targetAmount - contributed);
    if (remainingTarget <= 0) continue;

    const percent = goal.allocationPercent ?? 0;
    const rawAmount = roundCurrency((income.amount * percent) / 100);
    const amount = roundCurrency(Math.min(rawAmount, remainingTarget, remainingIncome));
    if (amount <= 0) continue;

    remainingIncome = roundCurrency(remainingIncome - amount);
    const capped = amount < rawAmount;
    results.push({
      goalId: goal.id,
      amount,
      note: `Auto-allocated ${percent}% from income: "${income.note || 'Earnings'}"${capped ? ' (capped at the pot target or available income)' : ''}`,
    });
  }

  return results;
}
