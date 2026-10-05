import type { Expense } from '../types/expense.ts';
import type { IncomeRecord } from '../types/income.ts';
import { getMonthIncome } from './income.ts';

export interface MonthlyFinancialSummary {
  year: number;
  month: number; // 0-11
  monthLabel: string;
  moneyIn: number;
  moneyOut: number;
  net: number;
  savingsRate: number | null; // percentage, can be negative
  previousMonthNet: number | null;
  netChangePercentage: number | null;
}

export interface CategoryAnalysisItem {
  category: string;
  spent: number;
  percentage: number;
  previousSpent: number;
  changePercentage: number | null;
}

export interface BudgetHealthItem {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  percentageUsed: number;
  status: 'Under Control' | 'Approaching Limit' | 'Over Budget';
}

export interface SpendingTrendResult {
  currentMonthTotal: number;
  previousMonthTotal: number;
  averageMonthlyTotal: number;
  direction: 'Increasing' | 'Decreasing' | 'Stable' | 'Insufficient Data';
}

export interface FinancialInsightsResult {
  summary: MonthlyFinancialSummary;
  categories: CategoryAnalysisItem[];
  highestCategory: CategoryAnalysisItem | null;
  trend: SpendingTrendResult;
  budgetHealth: BudgetHealthItem[];
  insights: string[];
}

function sumExpenses(exps: Expense[]): number {
  return exps.reduce((sum, e) => sum + e.amount, 0);
}

export function calculateSavingsRate(moneyIn: number, moneyOut: number): number | null {
  if (moneyIn <= 0) return null;
  return ((moneyIn - moneyOut) / moneyIn) * 100;
}

export function generateFinancialInsights({
  incomeList,
  expenses,
  limits,
  targetMonth = new Date(),
}: {
  incomeList: IncomeRecord[];
  expenses: Expense[];
  limits: Record<string, number>;
  targetMonth?: Date;
}): FinancialInsightsResult {
  const year = targetMonth.getFullYear();
  const month = targetMonth.getMonth();

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(targetMonth);

  // Current month cash flow
  const currentIncome = getMonthIncome(incomeList, targetMonth);
  const moneyIn = currentIncome.reduce((sum, item) => sum + item.amount, 0);

  const currentExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
  const moneyOut = sumExpenses(currentExpenses);
  const net = moneyIn - moneyOut;
  const savingsRate = calculateSavingsRate(moneyIn, moneyOut);

  // Previous month cash flow
  const prevMonthDate = new Date(year, month - 1, 1, 12);
  const prevYear = prevMonthDate.getFullYear();
  const prevM = prevMonthDate.getMonth();
  const prevIncomeList = getMonthIncome(incomeList, prevMonthDate);
  const prevMoneyIn = prevIncomeList.reduce((sum, item) => sum + item.amount, 0);
  const prevExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === prevYear && d.getMonth() === prevM;
  });
  const prevMoneyOut = sumExpenses(prevExpenses);
  const previousMonthNet = prevMoneyIn - prevMoneyOut;
  const netChangePercentage = previousMonthNet !== 0 ? ((net - previousMonthNet) / Math.abs(previousMonthNet)) * 100 : null;

  const summary: MonthlyFinancialSummary = {
    year,
    month,
    monthLabel,
    moneyIn,
    moneyOut,
    net,
    savingsRate,
    previousMonthNet,
    netChangePercentage,
  };

  // Category analysis
  const currentCategoryTotals = new Map<string, number>();
  currentExpenses.forEach((e) => {
    currentCategoryTotals.set(e.category, (currentCategoryTotals.get(e.category) ?? 0) + e.amount);
  });

  const prevCategoryTotals = new Map<string, number>();
  prevExpenses.forEach((e) => {
    prevCategoryTotals.set(e.category, (prevCategoryTotals.get(e.category) ?? 0) + e.amount);
  });

  const categories: CategoryAnalysisItem[] = [...currentCategoryTotals.entries()]
    .map(([category, spent]) => {
      const percentage = moneyOut > 0 ? (spent / moneyOut) * 100 : 0;
      const previousSpent = prevCategoryTotals.get(category) ?? 0;
      const changePercentage = previousSpent > 0 ? ((spent - previousSpent) / previousSpent) * 100 : null;
      return { category, spent, percentage, previousSpent, changePercentage };
    })
    .sort((a, b) => b.spent - a.spent);

  const highestCategory = categories.length > 0 ? categories[0] : null;

  // Spending trend across recent months
  const recentMonthsTotals: number[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(year, month - i, 1, 12);
    const mExps = expenses.filter((e) => {
      const ed = new Date(e.date);
      return ed.getFullYear() === d.getFullYear() && ed.getMonth() === d.getMonth();
    });
    recentMonthsTotals.push(sumExpenses(mExps));
  }

  const averageMonthlyTotal = recentMonthsTotals.reduce((a, b) => a + b, 0) / recentMonthsTotals.length;
  const prevTotal = recentMonthsTotals.length >= 2 ? recentMonthsTotals[recentMonthsTotals.length - 2] : 0;
  const currTotal = recentMonthsTotals[recentMonthsTotals.length - 1];

  let direction: SpendingTrendResult['direction'] = 'Insufficient Data';
  if (recentMonthsTotals.length >= 2 && prevTotal > 0) {
    const diff = currTotal - prevTotal;
    const ratio = diff / prevTotal;
    if (ratio > 0.05) direction = 'Increasing';
    else if (ratio < -0.05) direction = 'Decreasing';
    else direction = 'Stable';
  }

  const trend: SpendingTrendResult = {
    currentMonthTotal: currTotal,
    previousMonthTotal: prevTotal,
    averageMonthlyTotal,
    direction,
  };

  // Budget health
  const budgetHealth: BudgetHealthItem[] = Object.entries(limits).map(([category, limit]) => {
    const spent = currentCategoryTotals.get(category) ?? 0;
    const remaining = limit - spent;
    const percentageUsed = limit > 0 ? (spent / limit) * 100 : 0;
    let status: BudgetHealthItem['status'] = 'Under Control';
    if (spent > limit) {
      status = 'Over Budget';
    } else if (percentageUsed >= 80) {
      status = 'Approaching Limit';
    }
    return { category, limit, spent, remaining, percentageUsed, status };
  });

  // Generate conservative, data-driven insights
  const insights: string[] = [];
  if (moneyIn === 0 && moneyOut === 0) {
    insights.push('No income or expenses recorded for this month yet.');
  } else {
    if (savingsRate !== null) {
      if (savingsRate >= 20) {
        insights.push(`Strong savings rate this month at ${savingsRate.toFixed(1)}%.`);
      } else if (savingsRate > 0) {
        insights.push(`Positive savings rate this month at ${savingsRate.toFixed(1)}%.`);
      } else {
        insights.push(`Negative savings rate this month (${savingsRate.toFixed(1)}%). Expenses exceeded income.`);
      }
    }

    if (highestCategory) {
      insights.push(`${highestCategory.category} is your highest spending category, accounting for ${highestCategory.percentage.toFixed(0)}% of total expenses.`);
    }

    if (direction === 'Increasing') {
      insights.push('Total spending is increasing compared to the previous month.');
    } else if (direction === 'Decreasing') {
      insights.push('Total spending is decreasing compared to the previous month.');
    }

    const overBudgetCount = budgetHealth.filter((b) => b.status === 'Over Budget').length;
    if (overBudgetCount > 0) {
      insights.push(`You have ${overBudgetCount} category ${overBudgetCount === 1 ? 'limit' : 'limits'} exceeded this month.`);
    }
  }

  return {
    summary,
    categories,
    highestCategory,
    trend,
    budgetHealth,
    insights,
  };
}
