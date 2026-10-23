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
    const dateStr = new Date(expense.date).toISOString().split('T')[0];
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
