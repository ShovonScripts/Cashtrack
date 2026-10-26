import type { IncomeRecord, IncomeDraft } from '../types/income.ts';
import type { Expense } from '../types/expense.ts';

export function constrainIncomeEdit(record: IncomeRecord, changes: IncomeDraft): IncomeDraft {
  if (!record.recurringParentId) return changes;
  return {
    ...changes,
    date: record.date,
    isRecurring: record.isRecurring,
    recurringFrequency: record.recurringFrequency,
    recurringEndDate: record.recurringEndDate,
  };
}

/** Merges an edit into an income record. Omitted optional fields keep their stored value. */
export function applyIncomeUpdate(record: IncomeRecord, changes: IncomeDraft): IncomeRecord {
  return {
    ...record,
    amount: changes.amount,
    date: changes.date ?? record.date,
    note: changes.note ?? record.note,
    isRecurring: changes.isRecurring ?? record.isRecurring,
    recurringFrequency: changes.recurringFrequency ?? record.recurringFrequency,
    recurringEndDate: changes.recurringEndDate ?? record.recurringEndDate,
  };
}

export function getMonthIncome(incomeList: IncomeRecord[], month: Date): IncomeRecord[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  return incomeList.filter((item) => {
    const d = new Date(item.date);
    return d.getFullYear() === year && d.getMonth() === m;
  });
}

export function calculateMonthlyCashFlow({
  incomeList,
  expenses,
  month,
}: {
  incomeList: IncomeRecord[];
  expenses: Expense[];
  month: Date;
}) {
  const monthIncome = getMonthIncome(incomeList, month);
  const moneyIn = monthIncome.reduce((sum, item) => sum + item.amount, 0);

  const year = month.getFullYear();
  const m = month.getMonth();
  const monthExpenses = expenses.filter((expense) => {
    const d = new Date(expense.date);
    return d.getFullYear() === year && d.getMonth() === m;
  });
  const moneyOut = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

  const net = moneyIn - moneyOut;

  return {
    moneyIn,
    moneyOut,
    net,
    incomeCount: monthIncome.length,
    expenseCount: monthExpenses.length,
  };
}
