import { Brand } from '@/constants/theme';
import type { Expense } from '@/types/expense';
import { getMonthExpenses } from '@/utils/advisor';
import { formatDate, sumAmounts } from '@/utils/expense';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function buildMonthlyReportHtml({
  month,
  expenses,
  limits,
  name,
  countryName,
  currencyCode,
  formatAmount,
}: {
  month: Date;
  expenses: Expense[];
  limits: Record<string, number>;
  name: string;
  countryName: string;
  currencyCode: string;
  formatAmount: (amount: number) => string;
}): string {
  const monthExpenses = getMonthExpenses(expenses, month);
  const total = sumAmounts(monthExpenses);
  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month);

  const categoryTotals = new Map<string, number>();
  for (const expense of monthExpenses) {
    categoryTotals.set(expense.category, (categoryTotals.get(expense.category) ?? 0) + expense.amount);
  }
  const categoriesUsed = categoryTotals.size;
  const categories = [...new Set([...categoryTotals.keys(), ...Object.keys(limits)])]
    .map((category) => [category, categoryTotals.get(category) ?? 0] as const)
    .sort((first, second) => second[1] - first[1]);

  const largestExpense = monthExpenses.length ? Math.max(...monthExpenses.map((e) => e.amount)) : 0;
  const highestCategory = categories.length && categories[0][1] > 0 ? categories[0] : null;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const overBudgetCount = categories.filter(([category, spent]) => limits[category] !== undefined && spent > limits[category]).length;

  const categoryRows = categories.length
    ? categories.map(([category, spent]) => {
        const limit = limits[category];
        const percentOfTotal = total > 0 ? Math.round((spent / total) * 100) : 0;
        const status = limit === undefined
          ? 'No limit set'
          : spent > limit
            ? `Over by ${formatAmount(spent - limit)}`
            : `${formatAmount(limit - spent)} remaining`;
        return `<tr><td><strong>${escapeHtml(category)}</strong></td><td class="numeric">${escapeHtml(formatAmount(spent))}</td><td class="numeric">${limit === undefined ? '—' : escapeHtml(formatAmount(limit))}</td><td class="numeric">${percentOfTotal}%</td><td><span class="badge ${limit !== undefined && spent > limit ? 'badge-danger' : 'badge-normal'}">${escapeHtml(status)}</span></td></tr>`;
      }).join('')
    : '<tr><td colspan="5" class="empty">No expenses were recorded for this month.</td></tr>';

  const transactionRows = monthExpenses.length
    ? monthExpenses.map((expense) => `<tr><td>${escapeHtml(formatDate(expense.date))}</td><td><strong>${escapeHtml(expense.category)}</strong></td><td>${escapeHtml(expense.note || '—')}</td><td class="numeric">${escapeHtml(formatAmount(expense.amount))}</td></tr>`).join('')
    : '<tr><td colspan="4" class="empty">No transactions to show.</td></tr>';

  const displayName = name.trim() ? `<p class="byline">Prepared for <strong>${escapeHtml(name.trim())}</strong></p>` : '';
  const generatedAt = new Intl.DateTimeFormat('en', { dateStyle: 'full', timeStyle: 'short' }).format(new Date());

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CashTrack Monthly Report — ${escapeHtml(monthLabel)}</title>
  <style>
    @page { size: A4; margin: 16mm 14mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #1e1e2d; font: 11px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif; background: #ffffff; }
    .header-container { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #eaeaf2; padding-bottom: 14px; margin-bottom: 18px; }
    .wordmark { color: ${Brand.primary}; font-size: 24px; font-weight: 800; letter-spacing: -.6px; }
    .tagline { color: #6e6e80; font-size: 8px; letter-spacing: 1.2px; font-weight: 700; text-transform: uppercase; }
    .report-title-area { text-align: right; }
    h1 { margin: 0; color: #111118; font-size: 24px; line-height: 1.2; }
    .byline { margin: 4px 0 0; color: #555566; font-size: 11px; }
    .meta { margin-top: 2px; color: #737385; font-size: 9px; }

    .hero { margin: 16px 0; border-radius: 12px; background: ${Brand.deep}; color: white; padding: 16px 20px; }
    .hero-top { display: flex; justify-content: space-between; align-items: center; }
    .hero-label { color: ${Brand.bright}; font-size: 9px; letter-spacing: 1.2px; font-weight: 700; text-transform: uppercase; }
    .hero-total { margin-top: 4px; font-size: 32px; font-weight: 800; }
    .hero-count { color: #c0d0ff; font-size: 11px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
    .stat { border: 1px solid #e4e4ed; border-radius: 8px; padding: 10px; background: #fbfbfc; }
    .stat-label { color: #707080; font-size: 8px; text-transform: uppercase; letter-spacing: .8px; font-weight: 700; }
    .stat-value { margin-top: 4px; font-size: 14px; font-weight: 700; color: #111118; }

    h2 { margin: 20px 0 8px; font-size: 13px; color: #1e1b4b; border-left: 3px solid ${Brand.primary}; padding-left: 8px; text-transform: uppercase; letter-spacing: .5px; }

    table { width: 100%; border-collapse: collapse; font-size: 10px; margin-top: 4px; }
    thead { display: table-header-group; }
    th { padding: 7px 8px; background: ${Brand.accentWash}; color: ${Brand.primary}; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; font-weight: 700; border-bottom: 1px solid #dcdce6; }
    td { padding: 7px 8px; border-bottom: 1px solid #eeedf4; vertical-align: middle; color: #2d2d3a; }
    tr:nth-child(even) { background: #fafafc; }
    tr { page-break-inside: avoid; }
    .numeric { text-align: right; white-space: nowrap; }
    .empty { padding: 16px 8px; color: #737385; text-align: center; font-style: italic; }

    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: 700; }
    .badge-normal { background: #edf7ed; color: #1e7e34; }
    .badge-danger { background: #fde8e8; color: #c53030; }

    .footer { margin-top: 24px; border-top: 1px solid #e4e4ed; padding-top: 10px; color: #858596; font-size: 8px; display: flex; justify-content: space-between; align-items: center; }
  </style>
</head>
<body>
  <div class="header-container">
    <div>
      <div class="wordmark">CashTrack</div>
      <div class="tagline">Personal Finance Report</div>
    </div>
    <div class="report-title-area">
      <h1>${escapeHtml(monthLabel)}</h1>
      ${displayName}
      <div class="meta">Country: ${escapeHtml(countryName)} (${escapeHtml(currencyCode)})</div>
      <div class="meta">Generated: ${escapeHtml(generatedAt)}</div>
    </div>
  </div>

  <div class="hero">
    <div class="hero-top">
      <div>
        <div class="hero-label">Total Monthly Spending</div>
        <div class="hero-total">${escapeHtml(formatAmount(total))}</div>
      </div>
      <div style="text-align: right;">
        <div class="hero-count"><strong>${monthExpenses.length}</strong> ${monthExpenses.length === 1 ? 'transaction' : 'transactions'} recorded</div>
        <div class="hero-count" style="margin-top: 2px;">${categoriesUsed} active categories</div>
      </div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat">
      <div class="stat-label">Daily Average</div>
      <div class="stat-value">${escapeHtml(formatAmount(monthExpenses.length ? total / daysInMonth : 0))}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Largest Expense</div>
      <div class="stat-value">${escapeHtml(formatAmount(largestExpense))}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Top Category</div>
      <div class="stat-value">${highestCategory ? escapeHtml(highestCategory[0]) : 'None'}</div>
    </div>
    <div class="stat">
      <div class="stat-label">Budgets Exceeded</div>
      <div class="stat-value" style="${overBudgetCount > 0 ? 'color: #c53030;' : ''}">${overBudgetCount}</div>
    </div>
  </div>

  <h2>Category Breakdown & Budgets</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="numeric">Spent</th>
        <th class="numeric">Limit</th>
        <th class="numeric">% of Total</th>
        <th>Budget Status</th>
      </tr>
    </thead>
    <tbody>
      ${categoryRows}
    </tbody>
  </table>

  <h2>Transaction Ledger</h2>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Note</th>
        <th class="numeric">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${transactionRows}
    </tbody>
  </table>

  <div class="footer">
    <span>CashTrack · Local-First Expense Ledger</span>
    <span>Page 1 of 1</span>
  </div>
</body>
</html>`;
}
