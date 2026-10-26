import type { FinancialReminder } from '@/types/reminder';
import { calculateNextDueDate } from './reminder-recurrence.ts';

const PAYMENT_EPSILON = 0.005;

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}

export function getReminderRemainingAmount(reminder: FinancialReminder): number | null {
  if (reminder.status === 'paid') return 0;
  if (reminder.isVariableAmount || reminder.amount === null) return null;
  const paid = Math.max(0, reminder.paidAmountCurrentCycle ?? 0);
  return Math.max(0, roundMoney(reminder.amount - paid));
}

export function applyReminderPayment(
  reminder: FinancialReminder,
  paymentAmount: number,
  now: string = new Date().toISOString(),
): { reminder: FinancialReminder; coversFullAmount: boolean; remainingAmount: number | null } {
  const alreadyPaid = Math.max(0, reminder.paidAmountCurrentCycle ?? 0);
  const paidThisCycle = roundMoney(alreadyPaid + paymentAmount);
  const coversFullAmount =
    reminder.isVariableAmount ||
    reminder.amount === null ||
    paidThisCycle + PAYMENT_EPSILON >= reminder.amount;

  if (!coversFullAmount) {
    return {
      reminder: {
        ...reminder,
        paidAmountCurrentCycle: paidThisCycle,
        updatedAt: now,
      },
      coversFullAmount: false,
      remainingAmount: Math.max(0, roundMoney((reminder.amount ?? 0) - paidThisCycle)),
    };
  }

  if (reminder.repeatType === 'one-time') {
    return {
      reminder: {
        ...reminder,
        status: 'paid',
        paidAmountCurrentCycle: 0,
        updatedAt: now,
      },
      coversFullAmount: true,
      remainingAmount: 0,
    };
  }

  const totalInstallments = reminder.totalInstallments ?? 0;
  const isEmi = reminder.category === 'EMI' && totalInstallments > 0;
  const paidInstallments = isEmi
    ? Math.min((reminder.paidInstallments ?? 0) + 1, totalInstallments)
    : (reminder.paidInstallments ?? 0);

  if (isEmi && paidInstallments >= totalInstallments) {
    return {
      reminder: {
        ...reminder,
        status: 'paid',
        paidInstallments,
        paidAmountCurrentCycle: 0,
        updatedAt: now,
      },
      coversFullAmount: true,
      remainingAmount: 0,
    };
  }

  return {
    reminder: {
      ...reminder,
      dueDate: calculateNextDueDate(reminder.dueDate, reminder.repeatType, reminder.originalDueDate),
      status: 'upcoming',
      paidInstallments,
      paidAmountCurrentCycle: 0,
      updatedAt: now,
    },
    coversFullAmount: true,
    remainingAmount: 0,
  };
}
