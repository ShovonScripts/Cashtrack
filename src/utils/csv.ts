import type { Expense } from '@/types/expense';

export function generateCsvReport({
  expenses,
  currencyCode,
}: {
  expenses: Expense[];
  currencyCode: string;
}): string {
  const headers = ['Date', 'Category', 'Amount', 'Currency', 'Memo'];
  const rows = expenses.map((expense) => {
    // Expense dates are stored as ISO timestamps (UTC). Use local date parts
    // so an expense logged late in the day is not shifted to the next day.
    const date = new Date(expense.date);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
    const category = escapeCsv(expense.category);
    const amount = expense.amount.toFixed(2);
    const currency = escapeCsv(currencyCode);
    const memo = escapeCsv(expense.note || '');
    return [dateStr, category, amount, currency, memo].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function escapeCsv(field: string): string {
  const safe = FORMULA_PREFIX.test(field) ? `'${field}` : field;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}
