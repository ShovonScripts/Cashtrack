import test from 'node:test';
import assert from 'node:assert';
import { calculateCashFlowForecast } from '../src/utils/cash-flow-calculator.ts';
import type { Expense } from '../src/types/expense.ts';
import type { IncomeRecord } from '../src/types/income.ts';
import type { GoalWithProgress } from '../src/context/goal-context.tsx';

test('calculateCashFlowForecast projects end of month position accurately', () => {
  const incomeList: IncomeRecord[] = [
    { id: 'i1', amount: 40000, date: '2026-10-01T10:00:00.000Z', note: 'Salary' },
  ];

  const expenses: Expense[] = [
    { id: 'e1', amount: 10000, category: 'Food', date: '2026-10-05T10:00:00.000Z', note: 'Groceries' },
    { id: 'e2', amount: 5000, category: 'Bills', date: '2026-10-25T10:00:00.000Z', note: 'Rent', isRecurring: true },
  ];

  const goals: GoalWithProgress[] = [
    {
      id: 'g1',
      title: 'Savings',
      targetAmount: 10000,
      startDate: '2026-10-01T10:00:00.000Z',
      deadlineDate: '2026-12-31T10:00:00.000Z',
      frequency: 'monthly',
      status: 'active',
      contributedAmount: 2000,
      remainingAmount: 8000,
      progressPercent: 20,
      aheadBehindAmount: 0,
      isCompleted: false,
      contributions: [],
      frequencyRequired: 4000,
      monthlyRequired: 4000,
    },
  ];

  const result = calculateCashFlowForecast({
    incomeList,
    expenses,
    goals,
    currentDate: new Date('2026-10-15T10:00:00.000Z'),
  });

  // Current Net: 40000 income - 10000 food = 30000
  // Upcoming recurring (Rent on Oct 25): 5000
  // Planned goal contribution: 4000
  // Projected: 30000 - 5000 - 4000 = 21000
  assert.strictEqual(result.currentNet, 30000);
  assert.strictEqual(result.upcomingRecurringExpenses, 5000);
  assert.strictEqual(result.plannedGoalContributions, 4000);
  assert.strictEqual(result.projectedBalance, 21000);
  assert.strictEqual(result.status, 'SAFE');
});
