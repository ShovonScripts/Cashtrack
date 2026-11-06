import type { ReminderCategory, ReminderRepeatType } from '@/types/reminder';

/** Choices and validation for the Add and Edit bill screens. */

export const BILL_CATEGORIES: readonly ReminderCategory[] = [
  'Bills',
  'EMI',
  'Loan',
  'Rent',
  'Credit Card',
  'Insurance',
  'Subscription',
  'Education',
  'Tax',
  'Utilities',
  'Other',
];

export const BILL_REPEAT_TYPES: readonly { label: string; value: ReminderRepeatType }[] = [
  { label: 'Once', value: 'one-time' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' },
];

const ALARM_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export type BillFormValues = {
  title: string;
  isVariableAmount: boolean;
  amount: string;
  category: ReminderCategory;
  isAlarm: boolean;
  alarmTime: string;
  totalAmount: string;
  totalInstallments: string;
};

export type BillFormErrors = Partial<Record<'title' | 'amount' | 'alarmTime' | 'totalAmount' | 'totalInstallments', string>>;

export type ParsedBillForm = {
  title: string;
  amount: number | null;
  alarmTime: string | null;
  totalAmount: number | null;
  totalInstallments: number | null;
};

/**
 * Checks the bill form. `paidThisCycle` is what was already paid toward the
 * current cycle (editing), so a fixed amount can never drop to or below it.
 */
export function validateBillForm(
  values: BillFormValues,
  paidThisCycle = 0,
): { errors: BillFormErrors; parsed: ParsedBillForm | null } {
  const errors: BillFormErrors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Give the bill a name.';

  let amount: number | null = null;
  if (!values.isVariableAmount) {
    amount = values.amount.trim() ? Number(values.amount) : NaN;
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Enter an amount above zero, or turn on "Amount varies".';
    } else if (paidThisCycle > 0 && amount <= paidThisCycle + 0.005) {
      errors.amount = 'The amount must be more than what is already paid this cycle.';
    }
  }

  const alarmTime = values.alarmTime.trim();
  if (values.isAlarm && !ALARM_TIME_PATTERN.test(alarmTime)) {
    errors.alarmTime = 'Use 24-hour time, for example 09:00 or 18:30.';
  }

  let totalAmount: number | null = null;
  let totalInstallments: number | null = null;
  if (values.category === 'EMI') {
    if (values.totalAmount.trim()) {
      totalAmount = Number(values.totalAmount);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) errors.totalAmount = 'Enter an amount above zero, or leave it blank.';
    }
    if (values.totalInstallments.trim()) {
      totalInstallments = Number(values.totalInstallments);
      if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) {
        errors.totalInstallments = 'Enter a whole number, or leave it blank.';
      }
    }
  }

  if (Object.keys(errors).length > 0) return { errors, parsed: null };
  return {
    errors,
    parsed: {
      title: title.slice(0, 60),
      amount,
      alarmTime: values.isAlarm ? alarmTime : null,
      totalAmount,
      totalInstallments,
    },
  };
}
