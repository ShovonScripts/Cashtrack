import test from 'node:test';
import assert from 'node:assert';
import {
  isAutoSaveContribution,
  nextMilestone,
  overdueDays,
  potGlyph,
  potStatus,
  ruleLabel,
  runningTotals,
  sortPotsForList,
  type PotDisplayInput,
} from '../src/utils/pot-display.ts';

const now = new Date(2026, 10, 10, 12, 0);
const pot = (over: Partial<PotDisplayInput> & { id?: string } = {}): PotDisplayInput & { id: string } => ({
  id: 'p',
  targetAmount: 1000,
  contributedAmount: 200,
  aheadBehindAmount: 0,
  isCompleted: false,
  allocationType: 'manual',
  allocationPercent: null,
  deadlineDate: new Date(2027, 0, 1).toISOString(),
  potType: 'general',
  ...over,
});

test('pot status - one status per pot', () => {
  assert.strictEqual(potStatus(pot({ isCompleted: true }), now).kind, 'completed');
  assert.strictEqual(potStatus(pot({ allocationType: 'flexible' }), now).kind, 'open-ended');
  assert.strictEqual(potStatus(pot({ targetAmount: 0 }), now).kind, 'open-ended');
  assert.strictEqual(potStatus(pot({ deadlineDate: null }), now).kind, 'open-ended');
  assert.strictEqual(potStatus(pot({ deadlineDate: new Date(2026, 10, 1).toISOString() }), now).kind, 'overdue');
  assert.strictEqual(potStatus(pot({ aheadBehindAmount: -50 }), now).kind, 'behind');
  assert.strictEqual(potStatus(pot({ aheadBehindAmount: 50 }), now).kind, 'on-track');
});

test('pot status - overdue days count whole days and ignore finished pots', () => {
  assert.strictEqual(overdueDays(pot({ deadlineDate: new Date(2026, 10, 10, 11, 0).toISOString() }), now), 1);
  assert.strictEqual(overdueDays(pot({ deadlineDate: new Date(2026, 10, 7, 12, 0).toISOString() }), now), 3);
  assert.strictEqual(overdueDays(pot({ deadlineDate: new Date(2026, 10, 1).toISOString(), isCompleted: true }), now), 0);
  assert.strictEqual(overdueDays(pot({ deadlineDate: null }), now), 0);
});

test('pot labels match the form wording and icons', () => {
  assert.strictEqual(ruleLabel({ allocationType: 'percentage', allocationPercent: 10 }), 'Auto-save 10%');
  assert.strictEqual(ruleLabel({ allocationType: 'flexible', allocationPercent: null }), 'Flexible');
  assert.strictEqual(ruleLabel({ allocationType: 'manual', allocationPercent: null }), 'Manual');
  assert.strictEqual(potGlyph('general'), 'piggy-bank-outline');
  assert.strictEqual(potGlyph('piggy_bank'), 'piggy-bank-outline');
  assert.strictEqual(potGlyph('emergency'), 'shield-check-outline');
});

test('pot list - pots that need attention come first', () => {
  const sorted = sortPotsForList(
    [
      pot({ id: 'done', isCompleted: true }),
      pot({ id: 'open', allocationType: 'flexible' }),
      pot({ id: 'fine-late', aheadBehindAmount: 10, deadlineDate: new Date(2027, 5, 1).toISOString() }),
      pot({ id: 'fine-soon', aheadBehindAmount: 10, deadlineDate: new Date(2026, 11, 1).toISOString() }),
      pot({ id: 'behind', aheadBehindAmount: -10 }),
      pot({ id: 'overdue', deadlineDate: new Date(2026, 9, 1).toISOString() }),
    ],
    now,
  );
  assert.deepStrictEqual(sorted.map((p) => p.id), ['overdue', 'behind', 'fine-soon', 'fine-late', 'open', 'done']);
});

test('pot milestones and running totals', () => {
  assert.deepStrictEqual(nextMilestone(0, 1000), { percent: 25, amount: 250 });
  assert.deepStrictEqual(nextMilestone(250, 1000), { percent: 50, amount: 500 });
  assert.strictEqual(nextMilestone(1000, 1000), null);
  assert.strictEqual(nextMilestone(10, 0), null);

  const totals = runningTotals([
    { id: 'b', goalId: 'p', amount: 0.2, date: '2026-11-02T00:00:00.000Z', note: '' },
    { id: 'a', goalId: 'p', amount: 0.1, date: '2026-11-01T00:00:00.000Z', note: '' },
  ]);
  assert.deepStrictEqual(totals.map((t) => [t.contribution.id, t.total]), [['a', 0.1], ['b', 0.3]]);
  assert.strictEqual(isAutoSaveContribution({ sourceIncomeId: 'income-1' }), true);
  assert.strictEqual(isAutoSaveContribution({ sourceIncomeId: null }), false);
});
