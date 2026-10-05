import test from 'node:test';
import assert from 'node:assert';
import { calculateSavingsRate, generateFinancialInsights } from '../src/utils/insights-calculator.ts';
import type { Expense } from '../src/types/expense.ts';
import type { IncomeRecord } from '../src/types/income.ts';

test('calculateSavingsRate handles positive, zero, negative savings and zero income', () => {
  assert.strictEqual(calculateSavingsRate(50000, 35000), 30);
  assert.strictEqual(calculateSavingsRate(30000, 30000), 0);
  const negRate = calculateSavingsRate(30000, 35000);
  assert.ok(negRate !== null && Math.abs(negRate - (-16.666666666666664)) < 0.0001);
  assert.strictEqual(calculateSavingsRate(0, 10000), null);
});

test('generateFinancialInsights computes summary, categories, trends and budget health', () => {
  const incomeList: IncomeRecord[] = [
    { id: 'i1', amount: 50000, date: '2026-10-05T10:00:00.000Z', note: 'Salary' },
  ];

  const expenses: Expense[] = [
    { id: 'e1', amount: 15000, category: 'Food', date: '2026-10-10T10:00:00.000Z', note: 'Groceries' },
    { id: 'e2', amount: 5000, category: 'Transport', date: '2026-10-12T10:00:00.000Z', note: 'Fuel' },
    // Previous month (September)
    { id: 'e3', amount: 10000, category: 'Food', date: '2026-09-15T10:00:00.000Z', note: 'Groceries' },
  ];

  const limits = {
    Food: 12000, // over budget (15000 spent)
    Transport: 6000, // 5000 spent out of 6000 = 83.33% (Approaching Limit)
  };

  const result = generateFinancialInsights({
    incomeList,
    expenses,
    limits,
    targetMonth: new Date(2026, 9, 15), // October 2026
  });

  assert.strictEqual(result.summary.moneyIn, 50000);
  assert.strictEqual(result.summary.moneyOut, 20000);
  assert.strictEqual(result.summary.net, 30000);
  assert.strictEqual(result.summary.savingsRate, 60);

  assert.strictEqual(result.categories.length, 2);
  assert.strictEqual(result.categories[0].category, 'Food');
  assert.strictEqual(result.categories[0].spent, 15000);

  assert.strictEqual(result.budgetHealth.length, 2);
  const foodHealth = result.budgetHealth.find((b) => b.category === 'Food');
  assert.strictEqual(foodHealth?.status, 'Over Budget');

  const transportHealth = result.budgetHealth.find((b) => b.category === 'Transport');
  assert.strictEqual(transportHealth?.status, 'Approaching Limit');

  assert.strictEqual(result.insights.length > 0, true);
});

test('generateFinancialInsights handles empty datasets and zero income gracefully', () => {
  const result = generateFinancialInsights({
    incomeList: [],
    expenses: [],
    limits: {},
    targetMonth: new Date(2026, 9, 15),
  });

  assert.strictEqual(result.summary.moneyIn, 0);
  assert.strictEqual(result.summary.moneyOut, 0);
  assert.strictEqual(result.summary.net, 0);
  assert.strictEqual(result.summary.savingsRate, null);
  assert.strictEqual(result.categories.length, 0);
});
