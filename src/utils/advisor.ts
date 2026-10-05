import type { Expense } from '../types/expense.ts';
import { sumAmounts } from './expense.ts';

export type BudgetNoticeLevel = 'over' | 'near' | 'pace';

export type BudgetInsight = {
  category: string;
  level: BudgetNoticeLevel;
  spent: number;
  limit: number;
  remaining: number;
  percentUsed: number;
  projectedSpend: number;
};

export type FinancialHealthStatus = 'Excellent' | 'Good' | 'Caution' | 'Overspending';

export type FinancialIntelligence = {
  projectedMonthSpend: number;
  dailyBurnRate: number;
  daysRemaining: number;
  savingsRate: number;
  financialHealthStatus: FinancialHealthStatus;
  smartTip: string;
};

function isInMonth(isoDate: string, month: Date): boolean {
  const date = new Date(isoDate);
  return date.getFullYear() === month.getFullYear() && date.getMonth() === month.getMonth();
}

export function getCategoryMonthlySpend(expenses: Expense[], category: string, month: Date): number {
  return sumAmounts(expenses.filter((expense) => expense.category === category && isInMonth(expense.date, month)));
}

/** Rule-based, explainable budget nudges. Projection alerts only apply to the current month. */
export function getBudgetInsights(
  expenses: Expense[],
  limits: Record<string, number>,
  month: Date = new Date()
): BudgetInsight[] {
  const today = new Date();
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? today.getDate() : daysInMonth;

  return Object.entries(limits)
    .map(([category, limit]) => {
      const spent = getCategoryMonthlySpend(expenses, category, month);
      const percentUsed = limit > 0 ? spent / limit : 0;
      const projectedSpend = daysElapsed > 0 ? (spent / daysElapsed) * daysInMonth : spent;
      let level: BudgetNoticeLevel | null = null;

      if (spent > limit) level = 'over';
      else if (percentUsed >= 0.8) level = 'near';
      else if (isCurrentMonth && daysElapsed >= 5 && projectedSpend > limit) level = 'pace';

      return level ? { category, level, spent, limit, remaining: limit - spent, percentUsed, projectedSpend } : null;
    })
    .filter((insight): insight is BudgetInsight => insight !== null)
    .sort((first, second) => {
      const priority = { over: 0, near: 1, pace: 2 } satisfies Record<BudgetNoticeLevel, number>;
      return priority[first.level] - priority[second.level] || second.percentUsed - first.percentUsed;
    });
}

export function getMonthExpenses(expenses: Expense[], month: Date): Expense[] {
  return expenses
    .filter((expense) => isInMonth(expense.date, month))
    .sort((first, second) => new Date(second.date).getTime() - new Date(first.date).getTime());
}

export function getSmartFinancialIntelligence({
  expenses,
  totalIncome,
  month = new Date(),
}: {
  expenses: Expense[];
  totalIncome: number;
  month?: Date;
}): FinancialIntelligence {
  const monthExpenses = getMonthExpenses(expenses, month);
  const totalSpent = sumAmounts(monthExpenses);

  const today = new Date();
  const isCurrentMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const daysElapsed = isCurrentMonth ? Math.max(1, today.getDate()) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);

  const dailyBurnRate = totalSpent / daysElapsed;
  const projectedMonthSpend = isCurrentMonth ? totalSpent + (dailyBurnRate * daysRemaining) : totalSpent;

  const netCashFlow = totalIncome - totalSpent;
  const savingsRate = totalIncome > 0 ? Math.round((netCashFlow / totalIncome) * 100) : 0;

  let healthStatus: FinancialHealthStatus = 'Good';
  if (totalSpent > totalIncome && totalIncome > 0) {
    healthStatus = 'Overspending';
  } else if (savingsRate >= 30) {
    healthStatus = 'Excellent';
  } else if (savingsRate >= 10) {
    healthStatus = 'Good';
  } else {
    healthStatus = 'Caution';
  }

  let smartTip = 'Keep tracking your daily expenses to maintain a balanced budget.';
  if (healthStatus === 'Overspending') {
    smartTip = 'You are currently spending more than your recorded income. Try reviewing discretionary categories.';
  } else if (healthStatus === 'Excellent') {
    smartTip = `Great job! You're saving ${savingsRate}% of your income. Consider allocating surplus to your financial pots.`;
  } else if (projectedMonthSpend > totalIncome && totalIncome > 0) {
    smartTip = `At your current daily burn rate (${Math.round(dailyBurnRate)}/day), your projected monthly spending exceeds your income.`;
  } else {
    smartTip = `You have ${daysRemaining} days left this month. You're averaging well against your limits.`;
  }

  return {
    projectedMonthSpend,
    dailyBurnRate,
    daysRemaining,
    savingsRate,
    financialHealthStatus: healthStatus,
    smartTip,
  };
}
