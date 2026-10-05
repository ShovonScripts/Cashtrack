import test from 'node:test';
import assert from 'node:assert';
import { calculateMonthlyCashFlow, getMonthIncome } from '../src/utils/income.ts';
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
