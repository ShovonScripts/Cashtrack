import type { DebtRecord } from '@/types/debt';

/**
 * Pure debt-balance helpers shared by the list, detail screen and sharing.
 * Kept free of React/native imports so they can be unit-tested directly.
 */

/** Sum of valid recorded payments. Malformed (non-finite or non-positive) entries are ignored. */
export function getTotalPaid(debt: DebtRecord): number {
  return (debt.payments ?? []).reduce((sum, payment) => {
    return Number.isFinite(payment.amount) && payment.amount > 0 ? sum + payment.amount : sum;
  }, 0);
}

/**
 * Outstanding balance: the original amount minus recorded payments, never below
 * zero. A debt marked `settled` has no outstanding balance even when recorded
 * payments do not add up to the original amount (the remainder was written off),
 * so a settled debt can never keep appearing outstanding.
 */
export function getRemainingBalance(debt: DebtRecord): number {
  if (debt.status === 'settled') return 0;
  return Math.max(0, debt.amount - getTotalPaid(debt));
}

/** True when the debt is closed, either explicitly settled or fully paid off. */
export function isDebtSettled(debt: DebtRecord): boolean {
  return debt.status === 'settled' || getRemainingBalance(debt) <= 0;
}

export interface DebtSummary {
  youAreOwed: number;
  youOwe: number;
  net: number;
}

/** "You are owed" / "You owe" totals built from remaining balances of open debts. */
export function summarizeDebts(debts: readonly DebtRecord[]): DebtSummary {
  let youAreOwed = 0;
  let youOwe = 0;

  for (const debt of debts) {
    if (debt.status === 'settled') continue;
    const remaining = getRemainingBalance(debt);
    if (remaining <= 0) continue;
    if (debt.type === 'lent') {
      youAreOwed += remaining;
    } else {
      youOwe += remaining;
    }
  }

  return { youAreOwed, youOwe, net: youAreOwed - youOwe };
}

/**
 * Builds the reminder text used when sharing a debt. Reports the remaining
 * balance (not the original amount) and states plainly when the debt is settled.
 * `formatDueDate` is injected to keep this module dependency-free.
 */
export function buildDebtShareMessage(
  debt: DebtRecord,
  formatAmount: (amount: number) => string,
  formatDueDate: (isoDate: string) => string
): string {
  const original = formatAmount(debt.amount);
  const remaining = getRemainingBalance(debt);
  const dueString = debt.dueDate ? ` The due date is ${formatDueDate(debt.dueDate)}.` : '';

  if (remaining <= 0) {
    return debt.type === 'lent'
      ? `Hi ${debt.personName}, just to confirm the ${original} that I lent you is fully settled. Thanks!`
      : `Hi ${debt.personName}, just to confirm the ${original} that I borrowed from you is fully settled. Thanks!`;
  }

  const outstanding = formatAmount(remaining);
  return debt.type === 'lent'
    ? `Hi ${debt.personName}, just a friendly reminder regarding the ${outstanding} still outstanding from the ${original} that I lent you.${dueString} Thanks!`
    : `Hi ${debt.personName}, just a reminder regarding the ${outstanding} still outstanding from the ${original} that I borrowed from you.${dueString} Thanks!`;
}
