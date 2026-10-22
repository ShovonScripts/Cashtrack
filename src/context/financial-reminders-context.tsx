import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  markPaymentAndReminderRepo,
} from '@/storage/financial-reminders-repository';
import { scheduleReminderNotificationsAsync, cancelReminderNotificationsAsync } from '@/utils/reminder-notifications';
import { calculateNextDueDate } from '@/utils/reminder-recurrence';
import { useExpenses } from '@/context/expense-context';
import { useNow } from '@/hooks/use-now';

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
  remindersLoadError: boolean;
  reloadReminders: () => void;
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
  const [remindersLoadError, setRemindersLoadError] = useState(false);
  const [loadToken, setLoadToken] = useState(0);
  const now = useNow(60_000);
  const { addExpense, formatAmount, registerResetHandler, enableBillReminders } = useExpenses();

  const enableBillRemindersRef = useRef(enableBillReminders);
  useEffect(() => {
    enableBillRemindersRef.current = enableBillReminders;
  }, [enableBillReminders]);

  useEffect(() => {
    return registerResetHandler(async () => {
      setRawReminders([]);
      setPayments([]);
    });
  }, [registerResetHandler]);

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
          setRemindersLoadError(false);
          if (enableBillRemindersRef.current) {
            for (const rem of loadedReminders) {
              if (rem.status !== 'paid' && rem.status !== 'skipped') {
                void scheduleReminderNotificationsAsync(rem, safeFormat);
              }
            }
          }
        }
      } catch (error) {
        console.error('[cashtrack] Failed to load reminders', error);
        if (!cancelled) setRemindersLoadError(true);
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
  }, [safeFormat, loadToken]);

  const reloadReminders = useCallback(() => {
    setIsLoading(true);
    setLoadToken((token) => token + 1);
  }, []);

  // Turning the preference off cancels every pending bill reminder; turning it
  // back on reschedules the active ones.
  const remindersRef = useRef(rawReminders);
  useEffect(() => {
    remindersRef.current = rawReminders;
  }, [rawReminders]);

  const previousEnableBillRemindersRef = useRef(enableBillReminders);
  useEffect(() => {
    if (previousEnableBillRemindersRef.current === enableBillReminders) return;
    previousEnableBillRemindersRef.current = enableBillReminders;

    for (const reminder of remindersRef.current) {
      if (!enableBillReminders) {
        void cancelReminderNotificationsAsync(reminder.id);
      } else if (reminder.status !== 'paid' && reminder.status !== 'skipped') {
        void scheduleReminderNotificationsAsync(reminder, safeFormat);
      }
    }
  }, [enableBillReminders, safeFormat]);

  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const reminders = useMemo<ReminderWithDerivedStatus[]>(() => {
    const [year, month, day] = todayKey.split('-').map(Number);
    const today = new Date(year, month - 1, day);

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
  }, [rawReminders, todayKey]);

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
      isAlarm: draft.isAlarm,
      alarmTime: draft.alarmTime ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await insertReminder(reminder);
    setRawReminders((current) => [reminder, ...current]);
    if (enableBillReminders) {
      void scheduleReminderNotificationsAsync(reminder, safeFormat);
    }
    return reminder;
  }, [safeFormat, enableBillReminders]);

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
      isAlarm: draft.isAlarm,
      alarmTime: draft.alarmTime ?? null,
      updatedAt: new Date().toISOString(),
    };

    await updateReminderRepo(updated);
    setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    if (enableBillReminders) {
      void scheduleReminderNotificationsAsync(updated, safeFormat);
    }
  }, [rawReminders, safeFormat, enableBillReminders]);

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

    let updated: FinancialReminder;
    if (target.repeatType !== 'one-time') {
      const nextDueDate = calculateNextDueDate(target.dueDate, target.repeatType, target.originalDueDate);
      const isEmi = target.category === 'EMI' && target.totalInstallments && target.totalInstallments > 0;
      const nextPaidInstallments = isEmi ? Math.min((target.paidInstallments ?? 0) + 1, target.totalInstallments!) : (target.paidInstallments ?? 0);
      const isEmiFinished = isEmi && nextPaidInstallments >= target.totalInstallments!;

      if (isEmiFinished) {
        updated = {
          ...target,
          status: 'paid',
          paidInstallments: nextPaidInstallments,
          updatedAt: new Date().toISOString(),
        };
      } else {
        updated = {
          ...target,
          dueDate: nextDueDate,
          status: 'upcoming',
          paidInstallments: nextPaidInstallments,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      updated = {
        ...target,
        status: 'paid',
        updatedAt: new Date().toISOString(),
      };
    }

    await markPaymentAndReminderRepo(payment, updated);
    setPayments((current) => [payment, ...current]);
    setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    void cancelReminderNotificationsAsync(id);
    if (updated.status === 'upcoming' && enableBillReminders) {
      void scheduleReminderNotificationsAsync(updated, safeFormat);
    }
  }, [rawReminders, addExpense, safeFormat, enableBillReminders]);

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
      if (enableBillReminders) {
        void scheduleReminderNotificationsAsync(updated, safeFormat);
      }
    } else {
      const updated: FinancialReminder = {
        ...target,
        status: 'skipped',
        updatedAt: new Date().toISOString(),
      };
      await updateReminderRepo(updated);
      setRawReminders((current) => current.map((r) => (r.id === id ? updated : r)));
    }
  }, [rawReminders, safeFormat, enableBillReminders]);

  const getReminder = useCallback(
    (id: string) => reminders.find((r) => r.id === id),
    [reminders]
  );

  const value = useMemo(
    () => ({
      reminders,
      payments,
      isLoading,
      remindersLoadError,
      reloadReminders,
      addReminder,
      updateReminder,
      deleteReminder,
      markAsPaid,
      skipReminder,
      getReminder,
    }),
    [reminders, payments, isLoading, remindersLoadError, reloadReminders, addReminder, updateReminder, deleteReminder, markAsPaid, skipReminder, getReminder]
  );

  return <FinancialRemindersContext.Provider value={value}>{children}</FinancialRemindersContext.Provider>;
}

export function useFinancialReminders() {
  const context = useContext(FinancialRemindersContext);
  if (!context) throw new Error('useFinancialReminders must be used inside a <FinancialRemindersProvider>');
  return context;
}
