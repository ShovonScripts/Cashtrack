export type ReminderCategory =
  | 'Bills'
  | 'EMI'
  | 'Loan'
  | 'Rent'
  | 'Credit Card'
  | 'Insurance'
  | 'Subscription'
  | 'Education'
  | 'Tax'
  | 'Utilities'
  | 'Other';

export type ReminderRepeatType = 'one-time' | 'weekly' | 'monthly' | 'yearly';

export type ReminderStatus = 'upcoming' | 'due_today' | 'overdue' | 'paid' | 'skipped';

export type FinancialReminder = {
  id: string;
  title: string;
  amount: number | null; // null if variable amount
  isVariableAmount: boolean;
  category: ReminderCategory;
  dueDate: string; // ISO string
  originalDueDate?: string | null; // For anchor-stable recurrence
  repeatType: ReminderRepeatType;
  status: ReminderStatus;
  notes: string;
  totalAmount?: number | null; // For EMI
  installmentAmount?: number | null; // For EMI
  totalInstallments?: number | null; // For EMI
  paidInstallments?: number; // For EMI
  createdAt: string;
  updatedAt: string;
};

export type FinancialReminderDraft = {
  title: string;
  amount: number | null;
  isVariableAmount: boolean;
  category: ReminderCategory;
  dueDate: string;
  originalDueDate?: string | null;
  repeatType: ReminderRepeatType;
  notes?: string;
  totalAmount?: number | null;
  installmentAmount?: number | null;
  totalInstallments?: number | null;
  paidInstallments?: number;
};

export type ReminderPaymentRecord = {
  id: string;
  reminderId: string;
  amount: number;
  paidDate: string;
  expenseId?: string | null;
  notes?: string;
  createdAt: string;
};
