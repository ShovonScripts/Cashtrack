import type { Expense } from '../types/expense.ts';
import type { IncomeRecord } from '../types/income.ts';
import type { GoalWithProgress } from '../context/goal-context.tsx';
import { getMonthIncome } from './income.ts';

export interface CashFlowForecastResult {
  currentNet: number;
  expectedRemainingIncome: number;
  upcomingRecurringExpenses: number;
  plannedGoalContributions: number;
  projectedBalance: number;
  status: 'SAFE' | 'TIGHT' | 'AT RISK';
  explanation: string;
}

function sumExpenses(exps: Expense[]): number {
  return exps.reduce((sum, e) => sum + e.amount, 0);
}

export function calculateCashFlowForecast({
  incomeList,
  expenses,
  goals,
  currentDate = new Date(),
}: {
  incomeList: IncomeRecord[];
  expenses: Expense[];
  goals: GoalWithProgress[];
  currentDate?: Date;
}): CashFlowForecastResult {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayTime = currentDate.getTime();

  // Current month actuals so far (income up to end of month, expenses up to currentDate)
  const monthIncome = getMonthIncome(incomeList, currentDate);
  const totalIncomeSoFar = monthIncome.reduce((sum, item) => sum + item.amount, 0);

  const monthExpensesSoFar = expenses.filter((e) => {
    const d = new Date(e.date);
    return (
      d.getFullYear() === year &&
      d.getMonth() === month &&
      d.getTime() <= todayTime
    );
  });
  const totalExpenseSoFar = sumExpenses(monthExpensesSoFar);

  const currentNet = totalIncomeSoFar - totalExpenseSoFar;

  // Upcoming recurring expenses for the rest of the month (expenses flagged as recurring where date is in future of currentDate)
  const upcomingRecurringExpenses = expenses
    .filter((e) => {
      const d = new Date(e.date);
      return (
        e.isRecurring &&
        d.getFullYear() === year &&
        d.getMonth() === month &&
        d.getTime() > todayTime
      );
    })
    .reduce((sum, e) => sum + e.amount, 0);

  // Planned active goal contributions due this month
  const plannedGoalContributions = goals
    .filter((g) => !g.isCompleted)
    .reduce((sum, g) => sum + g.frequencyRequired, 0);

  const expectedRemainingIncome = 0; // Conservative: no phantom income

  const projectedBalance = currentNet + expectedRemainingIncome - upcomingRecurringExpenses - plannedGoalContributions;

  let status: CashFlowForecastResult['status'] = 'SAFE';
  let explanation = 'Your projected end-of-month balance is healthy and positive.';

  if (projectedBalance < 0) {
    status = 'AT RISK';
    explanation = 'Projected balance is negative after upcoming recurring bills and goal contributions.';
  } else if (projectedBalance < 5000) {
    status = 'TIGHT';
    explanation = 'Projected balance is positive but low. Keep an eye on upcoming commitments.';
  }

  return {
    currentNet,
    expectedRemainingIncome,
    upcomingRecurringExpenses,
    plannedGoalContributions,
    projectedBalance,
    status,
    explanation,
  };
}
