import type { RecurringFrequency } from './expense.ts';

export interface IncomeRecord {
  id: string;
  amount: number;
  date: string; // ISO 8601 timestamp
  note: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
  recurringParentId?: string;
}

export type IncomeDraft = Pick<IncomeRecord, 'amount' | 'note'> & {
  date?: string;
  isRecurring?: boolean;
  recurringFrequency?: RecurringFrequency;
  recurringEndDate?: string | null;
};
