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
    today: new Date('2026-01-11T00:00:00.000Z'),
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
    today: new Date('2026-01-21T00:00:00.000Z'),
  });

  assert.strictEqual(result.aheadBehindAmount < 0, true);
});

test('goal calculator - scenario 5: goal completed & exact target completion', () => {
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

test('goal calculator - scenario 7: target partially completed & zero contribution', () => {
  const zero = calculateGoalProgress({
    targetAmount: 5000,
    startDate: '2026-03-01T00:00:00.000Z',
    deadlineDate: '2026-03-31T00:00:00.000Z',
    currentAmount: 0,
    frequency: 'monthly',
    today: new Date('2026-03-01T00:00:00.000Z'),
  });
  assert.strictEqual(zero.contributedAmount, 0);
  assert.strictEqual(zero.remainingAmount, 5000);

  const partial = calculateGoalProgress({
    targetAmount: 10000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-01-11T00:00:00.000Z',
    currentAmount: 4000,
    frequency: 'weekly',
    today: new Date('2026-01-06T00:00:00.000Z'),
  });
  assert.strictEqual(partial.contributedAmount, 4000);
  assert.strictEqual(partial.remainingAmount, 6000);
});

test('goal calculator - scenario 8: February and leap years', () => {
  // Leap year 2028 February (29 days)
  const leapResult = calculateGoalProgress({
    targetAmount: 2900,
    startDate: '2028-02-01T00:00:00.000Z',
    deadlineDate: '2028-02-29T00:00:00.000Z',
    currentAmount: 1450,
    frequency: 'daily',
    today: new Date('2028-02-15T00:00:00.000Z'),
  });
  assert.strictEqual(leapResult.totalDays, 29);

  // Common year 2026 February (28 days)
  const commonResult = calculateGoalProgress({
    targetAmount: 2800,
    startDate: '2026-02-01T00:00:00.000Z',
    deadlineDate: '2026-02-28T00:00:00.000Z',
    currentAmount: 1000,
    frequency: 'monthly',
    today: new Date('2026-02-14T00:00:00.000Z'),
  });
  assert.strictEqual(commonResult.totalDays, 28);
});

test('goal calculator - scenario 9: different frequencies (quarterly, half-yearly, yearly)', () => {
  const quarterly = calculateGoalProgress({
    targetAmount: 90000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-12-31T00:00:00.000Z',
    currentAmount: 15000,
    frequency: 'quarterly',
    today: new Date('2026-06-01T00:00:00.000Z'),
  });
  assert.strictEqual(quarterly.frequencyRequired > 0, true);

  const halfYearly = calculateGoalProgress({
    targetAmount: 60000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-12-31T00:00:00.000Z',
    currentAmount: 10000,
    frequency: 'half-yearly',
    today: new Date('2026-07-01T00:00:00.000Z'),
  });
  assert.strictEqual(halfYearly.frequencyRequired > 0, true);
});

test('goal calculator - scenario 10: recovery contribution and overdue goals', () => {
  const recovery = calculateGoalProgress({
    targetAmount: 60000,
    startDate: '2026-01-01T00:00:00.000Z',
    deadlineDate: '2026-07-01T00:00:00.000Z',
    currentAmount: 10000,
    frequency: 'monthly',
    today: new Date('2026-05-01T00:00:00.000Z'), // fell behind
  });

  assert.strictEqual(recovery.remainingAmount, 50000);
  assert.strictEqual(recovery.monthlyRequired > 0, true);
});
