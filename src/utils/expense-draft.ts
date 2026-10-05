import type { Expense, ExpenseDraft } from '@/types/expense';

/**
 * Applies an edit to an expense without touching fields the draft does not mention.
 *
 * The Add and Edit forms only collect a subset of `Expense`, so `receiptUri`,
 * `isRecurring`, `recurringFrequency`, `recurringEndDate` and `recurringParentId`
 * arrive here absent (or explicitly `undefined`). Assigning keys one by one keeps an
 * omitted field intact, which a plain `{ ...expense, ...draft }` spread would not
 * guarantee once a caller passes an explicit `undefined`.
 */
export function mergeExpenseChanges(expense: Expense, draft: ExpenseDraft): Expense {
  const merged: Expense = { ...expense };

  if (typeof draft.amount === 'number') {
    merged.amount = draft.amount;
  }
  if (typeof draft.category === 'string') {
    merged.category = draft.category;
  }
  if (typeof draft.note === 'string') {
    merged.note = draft.note;
  }
  if (typeof draft.date === 'string') {
    merged.date = draft.date;
  }
  if (draft.isRecurring !== undefined) {
    merged.isRecurring = draft.isRecurring;
  }
  if (draft.recurringFrequency !== undefined) {
    merged.recurringFrequency = draft.recurringFrequency;
  }
  if (draft.recurringEndDate !== undefined) {
    merged.recurringEndDate = draft.recurringEndDate;
  }
  if (draft.receiptUri !== undefined) {
    merged.receiptUri = draft.receiptUri;
  }

  return merged;
}