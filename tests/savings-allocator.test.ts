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

test('calculateIncomeAllocations never allocates more than the income received', () => {
  const goals = [mockGoal({ id: 'g1', allocationPercent: 60 }), mockGoal({ id: 'g2', allocationPercent: 60 })];
  const income = mockIncome({ amount: 1000 });

  const allocations = calculateIncomeAllocations(income, goals);
  assert.equal(allocations.length, 2);
  assert.equal(allocations[0].amount, 600);
  assert.equal(allocations[1].amount, 400);
});

test('calculateIncomeAllocations caps contributions at the remaining target', () => {
  const goals = [mockGoal({ id: 'g1', targetAmount: 1000, allocationPercent: 10 })];
  const income = mockIncome({ amount: 1000 });
  const existing = [
    {
      id: 'c1',
      goalId: 'g1',
      amount: 950,
      date: '2026-09-01T00:00:00.000Z',
      note: '',
    },
  ];

  const allocations = calculateIncomeAllocations(income, goals, existing);
  assert.equal(allocations.length, 1);
  assert.equal(allocations[0].amount, 50);
});

test('calculateIncomeAllocations skips pots that are already fully funded', () => {
  const goals = [mockGoal({ id: 'g1', targetAmount: 100, allocationPercent: 10 })];
  const income = mockIncome({ amount: 1000 });
  const existing = [
    {
      id: 'c1',
      goalId: 'g1',
      amount: 100,
      date: '2026-09-01T00:00:00.000Z',
      note: '',
    },
  ];

  const allocations = calculateIncomeAllocations(income, goals, existing);
  assert.equal(allocations.length, 0);
});
