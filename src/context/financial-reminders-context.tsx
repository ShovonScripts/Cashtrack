import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { FinancialReminder, FinancialReminderDraft, ReminderPaymentRecord, ReminderStatus } from '@/types/reminder';
import {
  getAllReminders,
  insertReminder,
  updateReminder as updateReminderRepo,
  deleteReminderRepo,
  getAllPayments,
  insertPayment,
} from '@/storage/financial-reminders-repository';
import { scheduleReminderNotificationsAsync, cancelReminderNotificationsAsync } from '@/utils/reminder-notifications';
import { calculateNextDueDate } from '@/utils/reminder-recurrence';
import { useExpenses } from '@/context/expense-context';

let idCounter = 0;
function createReminderId(): string {
  idCounter += 1;
  return `rem-${Date.now().toString(36)}-${idCounter}`;
}

let paymentIdCounter = 0;
function createPaymentId(): string {
  paymentIdCounter += 1;
  return `pay-${Date.now().toString(36)}-${paymentIdCounter}`;
}

export type ReminderWithDerivedStatus = FinancialReminder & {
  derivedStatus: ReminderStatus;
  daysUntilDue: number;
};

type FinancialRemindersContextValue = {
  reminders: ReminderWithDerivedStatus[];
  payments: ReminderPaymentRecord[];
  isLoading: boolean;
  addReminder: (draft: FinancialReminderDraft) => Promise<FinancialReminder>;
  updateReminder: (id: string, draft: FinancialReminderDraft) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  markAsPaid: (id: string, paidAmount: number, paidDate: string, recordAsExpense: boolean, note?: string) => Promise<void>;
  skipReminder: (id: string) => Promise<void>;
  getReminder: (id: string) => ReminderWithDerivedStatus | undefined;
};

const FinancialRemindersContext = createContext<FinancialRemindersContextValue | undefined>(undefined);

export function FinancialRemindersProvider({ children }: { children: ReactNode }) {
  const [rawReminders, setRawReminders] = useState<FinancialReminder[]>([]);
  const [payments, setPayments] = useState<ReminderPaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addExpense, formatAmount } = useExpenses();

  const safeFormat = useCallback((amt: number | null) => (amt !== null ? formatAmount(amt) : ''), [formatAmount]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [loadedReminders, loadedPayments] = await Promise.all([
          getAllReminders(),
          getAllPayments(),
        ]);
        if (!cancelled) {
          setRawReminders(loadedReminders);
          setPayments(loadedPayments);
        }
      } catch (error) {
        console.error('[cashtrack] Failed to load reminders', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const reminders = useMemo<ReminderWithDerivedStatus[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return rawReminders.map((rem) => {
      const due = new Date(rem.dueDate);
      due.setHours(0, 0, 0, 0);

      const diffTime = due.getTime() - today.getTime();
      const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let derivedStatus: ReminderStatus = rem.status;
      if (rem.status !== 'paid' && rem.status !== 'skipped') {
        if (daysUntilDue < 0) {
          derivedStatus = 'overdue';
        } else if (daysUntilDue === 0) {
          derivedStatus = 'due_today';
        } else {
          derivedStatus = 'upcoming';
        }
      }

      return {
        ...rem,
        derivedStatus,
        daysUntilDue,
      };
    });
  }, [rawReminders]);

  const addReminder = useCallback(async (draft: FinancialReminderDraft): Promise<FinancialReminder> => {
    const now = new Date().toISOString();
    const reminder: FinancialReminder = {
      id: createReminderId(),
      title: draft.title.trim(),
      amount: draft.amount,
      isVariableAmount: draft.isVariableAmount,
      category: draft.category,
      dueDate: draft.dueDate,
      originalDueDate: draft.originalDueDate ?? draft.dueDate,
      repeatType: draft.repeatType,
      status: 'upcoming',
      notes: draft.notes?.trim() ?? '',
      totalAmount: draft.totalAmount ?? null,
      installmentAmount: draft.installmentAmount ?? null,
      totalInstallments: draft.totalInstallments ?? null,
      paidInstallments: 0,
      createdAt: now,
      updatedAt: now,
    };

    await insertReminder(reminder);
    setRawReminders((current) => [reminder, ...current]);
    void scheduleReminderNotificationsAsync(reminder, safeFormat);
    return reminder;
  }, [safeFormat]);

  const updateReminder = useCallback(async (id: string, draft: FinancialReminderDraft) => {
    const existing = rawReminders.find((r) => r.id === id);
    if (!existing) return;

    const updated: FinancialReminder = {
      ...existing,
      title: draft.title.trim(),
      amount: draft.amount,
      isVariableAmount: draft.isVariableAmount,
      category: draft.category,
      dueDate: draft.dueDate,
      originalDueDate: existing.originalDueDate ?? draft.dueDate,
      repeatType: draft.repeatType,
      notes: draft.notes?.trim() ?? '',
      totalAmount: draft.totalAmount ?? null,
      installmentAmount: draft.installmentAmount ?? null,
      totalInstallments: draft.totalInstallments ?? null,
      updatedAt: new Date().toISOString(),
    };

    await updateReminderRepo(updated);
    setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    void scheduleReminderNotificationsAsync(updated, safeFormat);
  }, [rawReminders, safeFormat]);

  const deleteReminder = useCallback(async (id: string) => {
    await deleteReminderRepo(id);
    setRawReminders((current) => current.filter((r) => r.id !== id));
    setPayments((current) => current.filter((p) => p.reminderId !== id));
    void cancelReminderNotificationsAsync(id);
  }, []);

  const markAsPaid = useCallback(async (id: string, paidAmount: number, paidDate: string, recordAsExpense: boolean, note?: string) => {
    const target = rawReminders.find((r) => r.id === id);
    if (!target) return;

    let expenseId: string | null = null;
    if (recordAsExpense) {
      const exp = addExpense({
        amount: paidAmount,
        category: target.category === 'EMI' ? 'EMI' : target.category === 'Rent' ? 'Housing' : 'Bills',
        date: paidDate,
        note: note?.trim() || `Payment for ${target.title}`,
      });
      expenseId = exp.id;
    }

    const payment: ReminderPaymentRecord = {
      id: createPaymentId(),
      reminderId: id,
      amount: paidAmount,
      paidDate,
      expenseId,
      notes: note?.trim() ?? '',
      createdAt: new Date().toISOString(),
    };

    await insertPayment(payment);
    setPayments((current) => [payment, ...current]);
    void cancelReminderNotificationsAsync(id);

    if (target.repeatType !== 'one-time') {
      const nextDueDate = calculateNextDueDate(target.dueDate, target.repeatType, target.originalDueDate);
      const isEmi = target.category === 'EMI' && target.totalInstallments && target.totalInstallments > 0;
      const nextPaidInstallments = isEmi ? Math.min((target.paidInstallments ?? 0) + 1, target.totalInstallments!) : (target.paidInstallments ?? 0);
      const isEmiFinished = isEmi && nextPaidInstallments >= target.totalInstallments!;

      if (isEmiFinished) {
        const updated: FinancialReminder = {
          ...target,
          status: 'paid',
          paidInstallments: nextPaidInstallments,
          updatedAt: new Date().toISOString(),
        };
        await updateReminderRepo(updated);
        setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
      } else {
        const updated: FinancialReminder = {
          ...target,
          dueDate: nextDueDate,
          status: 'upcoming',
          paidInstallments: nextPaidInstallments,
          updatedAt: new Date().toISOString(),
        };
        await updateReminderRepo(updated);
        setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
        void scheduleReminderNotificationsAsync(updated, safeFormat);
      }
    } else {
      const updated: FinancialReminder = {
        ...target,
        status: 'paid',
        updatedAt: new Date().toISOString(),
      };
      await updateReminderRepo(updated);
      setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    }
  }, [rawReminders, addExpense, safeFormat]);

  const skipReminder = useCallback(async (id: string) => {
    const target = rawReminders.find((r) => r.id === id);
    if (!target) return;

    void cancelReminderNotificationsAsync(id);

    if (target.repeatType !== 'one-time') {
      const nextDueDate = calculateNextDueDate(target.dueDate, target.repeatType, target.originalDueDate);
      const updated: FinancialReminder = {
        ...target,
        dueDate: nextDueDate,
        status: 'upcoming',
        updatedAt: new Date().toISOString(),
      };
      await updateReminderRepo(updated);
      setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
      void scheduleReminderNotificationsAsync(updated, safeFormat);
    } else {
      const updated: FinancialReminder = {
        ...target,
        status: 'skipped',
        updatedAt: new Date().toISOString(),
      };
      await updateReminderRepo(updated);
      setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    }
  }, [rawReminders, safeFormat]);

  const getReminder = useCallback(
    (id: string) => reminders.find((r) => r.id === id),
    [reminders]
  );

  const value = useMemo(
    () => ({
      reminders,
      payments,
      isLoading,
      addReminder,
      updateReminder,
      deleteReminder,
      markAsPaid,
      skipReminder,
      getReminder,
    }),
    [reminders, payments, isLoading, addReminder, updateReminder, deleteReminder, markAsPaid, skipReminder, getReminder]
  );

  return <FinancialRemindersContext.Provider value={value}>{children}</FinancialRemindersContext.Provider>;
}

export function useFinancialReminders() {
  const context = useContext(FinancialRemindersContext);
  if (!context) throw new Error('useFinancialReminders must be used inside a <FinancialRemindersProvider>');
  return context;
}
