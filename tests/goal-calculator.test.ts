import test from 'node:test';
import assert from 'node:assert';
import { calculateGoalProgress } from '../src/utils/goal-calculator.ts';

test('goal calculator - scenario 1: goal just started', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 0,
    frequency: 'monthly',
    today: new Date('2026-01-01T00:00:00.000Z'),
  });

  assert.strictEqual(result.elapsedDays, 0);
  assert.strictEqual(result.actualProgress, 0);
  assert.strictEqual(result.expectedProgress, 0);
  assert.strictEqual(result.isCompleted, false);
});

test('goal calculator - scenario 2: goal halfway through', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 15000,
    frequency: 'monthly',
    today: new Date('2026-01-16T00:00:00.000Z'),
  });

  assert.strictEqual(result.actualProgress, 15000);
  assert.strictEqual(result.remainingAmount, 15000);
  assert.strictEqual(result.isCompleted, false);
});

test('goal calculator - scenario 3: goal ahead', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 20000,
    frequency: 'monthly',
    today: new Date('2026-01-11T00:00:00.000Z'), // 10 days elapsed (~10000 expected)
  });

  assert.strictEqual(result.aheadBehindAmount > 0, true);
});

test('goal calculator - scenario 4: goal behind', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 5000,
    frequency: 'monthly',
    today: new Date('2026-01-21T00:00:00.000Z'), // 20 days elapsed (~20000 expected)
  });

  assert.strictEqual(result.aheadBehindAmount < 0, true);
});

test('goal calculator - scenario 5: goal completed', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 30000,
    frequency: 'monthly',
    today: new Date('2026-01-15T00:00:00.000Z'),
  });

  assert.strictEqual(result.isCompleted, true);
  assert.strictEqual(result.remainingAmount, 0);
});

test('goal calculator - scenario 6: deadline reached', () => {
  const result = calculateGoalProgress({
    targetAmount: 30000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-31T00:00:00.000Z',
    currentAmount: 25000,
    frequency: 'monthly',
    today: new Date('2026-02-01T00:00:00.000Z'),
  });

  assert.strictEqual(result.remainingDays, 0);
  assert.strictEqual(result.isCompleted, false);
});

test('goal calculator - scenario 7: target partially contributed', () => {
  const result = calculateGoalProgress({
    targetAmount: 10000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-11T00:00:00.000Z',
    currentAmount: 4000,
    frequency: 'weekly',
    today: new Date('2026-01-06T00:00:00.000Z'),
  });

  assert.strictEqual(result.contributedAmount, 4000);
  assert.strictEqual(result.remainingAmount, 6000);
});

test('goal calculator - scenario 8: zero contributions', () => {
  const result = calculateGoalProgress({
    targetAmount: 5000,
    startDate: '2026-03-01T00:00:00.000Z',
    deadlineDate: '2026-03-31T00:00:00.000Z',
    currentAmount: 0,
    frequency: 'monthly',
    today: new Date('2026-03-01T00:00:00.000Z'),
  });

  assert.strictEqual(result.contributedAmount, 0);
  assert.strictEqual(result.remainingAmount, 5000);
});

test('goal calculator - scenario 9: different frequencies', () => {
  const daily = calculateGoalProgress({
    targetAmount: 3650,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-12-31T00:00:00.000Z',
    currentAmount: 0,
    frequency: 'daily',
    today: new Date('2026-01-01T00:00:00.000Z'),
  });
  assert.strictEqual(daily.frequencyRequired > 0, true);

  const yearly = calculateGoalProgress({
    targetAmount: 12000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-12-31T00:00:00.000Z',
    currentAmount: 0,
    frequency: 'yearly',
    today: new Date('2026-01-01T00:00:00.000Z'),
  });
  assert.strictEqual(yearly.frequencyRequired > 0, true);
});

test('goal calculator - scenario 10: remaining contribution calculation', () => {
  const result = calculateGoalProgress({
    targetAmount: 12000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-07-01T00:00:00.000Z',
    currentAmount: 2000,
    frequency: 'monthly',
    today: new Date('2026-04-01T00:00:00.000Z'),
  });

  assert.strictEqual(result.remainingAmount, 10000);
  assert.strictEqual(result.monthlyRequired > 0, true);
});
