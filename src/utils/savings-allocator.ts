import type { MoneyGoal } from '../types/goal.ts';
import type { IncomeRecord } from '../types/income.ts';

export type AllocationResult = {
  goalId: string;
  amount: number;
  note: string;
};

export function calculateIncomeAllocations(income: IncomeRecord, goals: MoneyGoal[]): AllocationResult[] {
  const activeGoals = goals.filter(
    (g) => g.status === 'active' && g.allocationType === 'percentage' && typeof g.allocationPercent === 'number' && g.allocationPercent > 0
  );

  const results: AllocationResult[] = [];
  for (const goal of activeGoals) {
    const percent = goal.allocationPercent ?? 0;
    const rawAmount = (income.amount * percent) / 100;
    const amount = Math.round(rawAmount * 100) / 100;
    if (amount > 0) {
      results.push({
        goalId: goal.id,
        amount,
        note: `Auto-allocated ${percent}% from income: "${income.note || 'Earnings'}"`,
      });
    }
  }
  return results;
}
