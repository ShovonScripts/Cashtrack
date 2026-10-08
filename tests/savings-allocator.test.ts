import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateIncomeAllocations } from '../src/utils/savings-allocator.ts';
import type { MoneyGoal } from '../src/types/goal.ts';
import type { IncomeRecord } from '../src/types/income.ts';

const mockGoal = (overrides: Partial<MoneyGoal> = {}): MoneyGoal => ({
  id: 'goal-1',
  title: 'Piggy Bank',
  targetAmount: 1000,
  startDate: '2026-01-01T00:00:00.000Z',
  deadlineDate: '2026-12-31T00:00:00.000Z',
  frequency: 'monthly',
  status: 'active',
  potType: 'piggy_bank',
  allocationType: 'percentage',
  allocationPercent: 10,
  icon: 'piggy-bank',
  ...overrides,
});

const mockIncome = (overrides: Partial<IncomeRecord> = {}): IncomeRecord => ({
  id: 'inc-1',
  amount: 500,
  date: '2026-09-29T12:00:00.000Z',
  note: 'Salary',
  ...overrides,
});

test('calculateIncomeAllocations correctly computes percentage allocations', () => {
  const goals = [mockGoal({ id: 'g1', allocationPercent: 10 }), mockGoal({ id: 'g2', allocationPercent: 5 })];
  const income = mockIncome({ amount: 1000 });

  const allocations = calculateIncomeAllocations(income, goals);
  assert.equal(allocations.length, 2);
  assert.equal(allocations[0].amount, 100);
  assert.equal(allocations[1].amount, 50);
});

test('calculateIncomeAllocations ignores manual or completed goals', () => {
  const goals = [
    mockGoal({ id: 'g1', allocationType: 'manual' }),
    mockGoal({ id: 'g2', status: 'completed', allocationPercent: 20 }),
  ];
  const income = mockIncome({ amount: 1000 });

  const allocations = calculateIncomeAllocations(income, goals);
  assert.equal(allocations.length, 0);
});
