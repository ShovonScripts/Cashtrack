import test from 'node:test';
import assert from 'node:assert';
import { isDefaultPotTitle, potMeta, toPotChoice, validateGoalForm, type GoalFormValues } from '../src/utils/goal-form.ts';

const base: GoalFormValues = { title: 'Holiday', targetAmount: '', allocationType: 'percentage', allocationPercent: '10' };

test('goal form - valid open-ended auto-save pot', () => {
  const { errors, parsed } = validateGoalForm(base, 0);
  assert.deepStrictEqual(errors, {});
  assert.deepStrictEqual(parsed, { title: 'Holiday', targetAmount: 0, allocationPercent: 10 });
});

test('goal form - title is required and trimmed', () => {
  assert.ok(validateGoalForm({ ...base, title: '   ' }, 0).errors.title);
  assert.strictEqual(validateGoalForm({ ...base, title: '  Car  ' }, 0).parsed?.title, 'Car');
});

test('goal form - target must be positive when given', () => {
  assert.ok(validateGoalForm({ ...base, targetAmount: '0' }, 0).errors.targetAmount);
  assert.ok(validateGoalForm({ ...base, targetAmount: '1.2.3' }, 0).errors.targetAmount);
  assert.strictEqual(validateGoalForm({ ...base, targetAmount: '5000' }, 0).parsed?.targetAmount, 5000);
});

test('goal form - percentage range and the 100% total cap', () => {
  assert.ok(validateGoalForm({ ...base, allocationPercent: '' }, 0).errors.allocationPercent);
  assert.ok(validateGoalForm({ ...base, allocationPercent: '0' }, 0).errors.allocationPercent);
  assert.ok(validateGoalForm({ ...base, allocationPercent: '101' }, 0).errors.allocationPercent);
  assert.match(validateGoalForm({ ...base, allocationPercent: '30' }, 80).errors.allocationPercent ?? '', /110%/);
  assert.strictEqual(validateGoalForm({ ...base, allocationPercent: '20' }, 80).parsed?.allocationPercent, 20);
});

test('goal form - percentage is ignored for flexible and manual pots', () => {
  for (const allocationType of ['flexible', 'manual'] as const) {
    const { parsed } = validateGoalForm({ ...base, allocationType, allocationPercent: 'abc' }, 100);
    assert.strictEqual(parsed?.allocationPercent, null);
  }
});

test('goal form - legacy pot types and default titles', () => {
  assert.strictEqual(toPotChoice('general'), 'piggy_bank');
  assert.strictEqual(toPotChoice(undefined), 'piggy_bank');
  assert.strictEqual(toPotChoice('dream'), 'dream');
  assert.strictEqual(potMeta('emergency').icon, 'shield-check');
  assert.ok(isDefaultPotTitle(''));
  assert.ok(isDefaultPotTitle('Junior Savings'));
  assert.ok(!isDefaultPotTitle('Kids college fund'));
});

test('goal form - deadline must be after today, unless editing keeps the saved one', () => {
  const today = new Date(2026, 10, 10, 15, 0);
  const check = (deadline: Date | null, savedDeadline?: Date | null) =>
    validateGoalForm(base, 0, { deadline, savedDeadline, today }).errors.deadline;
  assert.ok(check(new Date(2026, 10, 9)));
  assert.ok(check(new Date(2026, 10, 10, 23, 0)));
  assert.strictEqual(check(new Date(2026, 10, 11)), undefined);
  assert.strictEqual(check(null), undefined);
  // An overdue pot can be edited without moving its deadline.
  assert.strictEqual(check(new Date(2026, 9, 1, 12), new Date(2026, 9, 1, 9)), undefined);
  assert.ok(check(new Date(2026, 9, 2), new Date(2026, 9, 1)));
  // No check given (older callers) means no deadline error.
  assert.strictEqual(validateGoalForm(base, 0).errors.deadline, undefined);
});
