import test from 'node:test';
import assert from 'node:assert';
import { calculateMonthlyCashFlow, getMonthIncome, applyIncomeUpdate, constrainIncomeEdit } from '../src/utils/income.ts';
import type { IncomeRecord } from '../src/types/income.ts';
import type { Expense } from '../src/types/expense.ts';

test('monthly income aggregation and cash flow calculations', () => {
  const janIncome: IncomeRecord[] = [
    { id: '1', amount: 30000, date: '2026-01-10T10:00:00.000Z', note: 'Salary' },
    { id: '2', amount: 5000, date: '2026-01-20T10:00:00.000Z', note: 'Freelance' },
  ];

  const febIncome: IncomeRecord[] = [
    { id: '3', amount: 40000, date: '2026-02-10T10:00:00.000Z', note: 'Salary' },
  ];

  const allIncome = [...janIncome, ...febIncome];

  const janExpenses: Expense[] = [
    { id: 'e1', amount: 10000, category: 'Food', date: '2026-01-15T10:00:00.000Z', note: 'Groceries' },
  ];

  const janDate = new Date(2026, 0, 15);
  const febDate = new Date(2026, 1, 15);

  const janFiltered = getMonthIncome(allIncome, janDate);
  assert.strictEqual(janFiltered.length, 2);

  const febFiltered = getMonthIncome(allIncome, febDate);
  assert.strictEqual(febFiltered.length, 1);

  const janCashFlow = calculateMonthlyCashFlow({
    incomeList: allIncome,
    expenses: janExpenses,
    month: janDate,
  });

  assert.strictEqual(janCashFlow.moneyIn, 35000);
  assert.strictEqual(janCashFlow.moneyOut, 10000);
  assert.strictEqual(janCashFlow.net, 25000);

  const febCashFlow = calculateMonthlyCashFlow({
    incomeList: allIncome,
    expenses: janExpenses,
    month: febDate,
  });

  assert.strictEqual(febCashFlow.moneyIn, 40000);
  assert.strictEqual(febCashFlow.moneyOut, 0);
  assert.strictEqual(febCashFlow.net, 40000);
});

test('editing income updates the date while preserving other fields', () => {
  const original: IncomeRecord = {
    id: 'income-1',
    amount: 30000,
    date: '2026-01-10T10:00:00.000Z',
    note: 'Salary',
    isRecurring: true,
    recurringFrequency: 'monthly',
    recurringEndDate: '2026-12-31T10:00:00.000Z',
  };

  const updated = applyIncomeUpdate(original, {
    amount: 32000,
    note: 'Salary revised',
    date: '2026-02-15T10:00:00.000Z',
    isRecurring: true,
    recurringFrequency: 'monthly',
  });

  assert.strictEqual(updated.date, '2026-02-15T10:00:00.000Z');
  assert.strictEqual(updated.amount, 32000);
  assert.strictEqual(updated.note, 'Salary revised');
  assert.strictEqual(updated.isRecurring, true);
  assert.strictEqual(updated.recurringFrequency, 'monthly');
  assert.strictEqual(updated.recurringEndDate, '2026-12-31T10:00:00.000Z');
  assert.strictEqual(original.date, '2026-01-10T10:00:00.000Z');
});

test('editing income without a date keeps the stored date', () => {
  const original: IncomeRecord = {
    id: 'income-2',
    amount: 5000,
    date: '2026-01-20T10:00:00.000Z',
    note: 'Freelance',
  };

  const updated = applyIncomeUpdate(original, {
    amount: 6000,
    note: 'Freelance final',
  });

  assert.strictEqual(updated.date, '2026-01-20T10:00:00.000Z');
  assert.strictEqual(updated.amount, 6000);
  assert.strictEqual(updated.note, 'Freelance final');
});

test('generated occurrences keep their recurring date while other fields update', () => {
  const generated: IncomeRecord = {
    id: 'income-child',
    amount: 30000,
    date: '2026-03-10T10:00:00.000Z',
    note: 'Salary',
    isRecurring: false,
    recurringParentId: 'income-parent',
  };

  const constrained = constrainIncomeEdit(generated, {
    amount: 31000,
    note: 'Salary revised',
    date: '2026-04-10T10:00:00.000Z',
    isRecurring: true,
    recurringFrequency: 'yearly',
  });
  const updated = applyIncomeUpdate(generated, constrained);

  assert.strictEqual(constrained.date, '2026-03-10T10:00:00.000Z');
  assert.strictEqual(constrained.isRecurring, false);
  assert.strictEqual(constrained.recurringFrequency, undefined);
  assert.strictEqual(updated.date, '2026-03-10T10:00:00.000Z');
  assert.strictEqual(updated.amount, 31000);
  assert.strictEqual(updated.note, 'Salary revised');
  assert.strictEqual(updated.isRecurring, false);
});

test('non-generated income can still change its date', () => {
  const original: IncomeRecord = {
    id: 'income-parent',
    amount: 1000,
    date: '2026-01-01T10:00:00.000Z',
    note: 'Rent share',
  };

  const constrained = constrainIncomeEdit(original, {
    amount: 1000,
    note: 'Rent share',
    date: '2026-02-01T10:00:00.000Z',
  });

  assert.strictEqual(constrained.date, '2026-02-01T10:00:00.000Z');
});

test('editing income can turn recurrence off', () => {
  const original: IncomeRecord = {
    id: 'income-3',
    amount: 1000,
    date: '2026-01-01T10:00:00.000Z',
    note: 'Rent share',
    isRecurring: true,
    recurringFrequency: 'monthly',
  };

  const updated = applyIncomeUpdate(original, {
    amount: 1000,
    note: 'Rent share',
    date: '2026-01-01T10:00:00.000Z',
    isRecurring: false,
  });

  assert.strictEqual(updated.isRecurring, false);
  assert.strictEqual(updated.recurringFrequency, 'monthly');
});
