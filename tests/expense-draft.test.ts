import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeExpenseChanges } from '../src/utils/expense-draft.ts';
import type { Expense, ExpenseDraft } from '../src/types/expense.ts';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-1',
    amount: 42,
    category: 'Food',
    date: '2026-09-29T12:00:00.000Z',
    note: 'Lunch',
    ...overrides,
  };
}

/** Exactly what src/components/expense-form.tsx submits today. */
const EDIT_FORM_DRAFT: ExpenseDraft = {
  amount: 55,
  category: 'Transport',
  note: 'Taxi',
  date: '2026-10-01T12:00:00.000Z',
};

test('an edit made by ExpenseForm leaves receiptUri intact', () => {
  const original = makeExpense({ receiptUri: 'file:///documents/receipts/receipt-1.jpg' });
  const merged = mergeExpenseChanges(original, EDIT_FORM_DRAFT);

  assert.equal(merged.receiptUri, 'file:///documents/receipts/receipt-1.jpg');
});

test('an edit made by ExpenseForm leaves the recurring flag intact', () => {
  const original = makeExpense({
    isRecurring: true,
    recurringFrequency: 'monthly',
    recurringEndDate: '2026-12-31T12:00:00.000Z',
  });
  const merged = mergeExpenseChanges(original, EDIT_FORM_DRAFT);

  assert.equal(merged.isRecurring, true);
  assert.equal(merged.recurringFrequency, 'monthly');
  assert.equal(merged.recurringEndDate, '2026-12-31T12:00:00.000Z');
});

test('an explicit undefined in the draft does not clear a stored value', () => {
  const original = makeExpense({
    receiptUri: 'file:///documents/receipts/receipt-1.jpg',
    isRecurring: true,
    recurringFrequency: 'weekly',
  });
  const merged = mergeExpenseChanges(original, {
    ...EDIT_FORM_DRAFT,
    receiptUri: undefined,
    isRecurring: undefined,
    recurringFrequency: undefined,
  });

  assert.equal(merged.receiptUri, 'file:///documents/receipts/receipt-1.jpg');
  assert.equal(merged.isRecurring, true);
  assert.equal(merged.recurringFrequency, 'weekly');
});

test('an explicit false or null is still applied', () => {
  const original = makeExpense({
    receiptUri: 'file:///documents/receipts/receipt-1.jpg',
    isRecurring: true,
    recurringEndDate: '2026-12-31T12:00:00.000Z',
  });
  const merged = mergeExpenseChanges(original, {
    ...EDIT_FORM_DRAFT,
    isRecurring: false,
    recurringEndDate: null,
    receiptUri: '',
  });

  assert.equal(merged.isRecurring, false);
  assert.equal(merged.recurringEndDate, null);
  assert.equal(merged.receiptUri, '');
});

test('the four form fields are actually written', () => {
  const merged = mergeExpenseChanges(makeExpense(), EDIT_FORM_DRAFT);

  assert.equal(merged.amount, 55);
  assert.equal(merged.category, 'Transport');
  assert.equal(merged.note, 'Taxi');
  assert.equal(merged.date, '2026-10-01T12:00:00.000Z');
});

test('the id and recurringParentId are never reassigned', () => {
  const original = makeExpense({ id: 'template-1' });
  const merged = mergeExpenseChanges(original, EDIT_FORM_DRAFT);

  assert.equal(merged.id, 'template-1');
});