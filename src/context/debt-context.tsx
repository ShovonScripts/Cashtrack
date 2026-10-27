import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import type { DebtRecord, DebtDraft, DebtPayment } from '@/types/debt';
import { backupUnreadableDebts, loadDebts, saveDebts } from '@/storage/debt-storage';
import { StorageParseError } from '@/storage/storage-errors';
import { checkAndTriggerDebtNotifications } from '@/utils/notifications';
import { useExpenses, usePreferences } from '@/context/expense-context';
import { SaveQueue, shouldSave } from '@/utils/save-queue';
import { debtReducer } from '@/utils/debt-reducer';

let debtIdCounter = 0;

function createDebtId(): string {
  debtIdCounter += 1;
  return `debt-${Date.now().toString(36)}-${debtIdCounter}`;
}

type DebtContextValue = {
  debts: DebtRecord[];
  isLoading: boolean;
  debtLoadError: boolean;
  debtRecovered: boolean;
  addDebt: (draft: DebtDraft) => DebtRecord;
  updateDebt: (id: string, changes: DebtDraft) => void;
  deleteDebt: (id: string) => void;
  settleDebt: (id: string) => void;
  addDebtPayment: (debtId: string, amount: number, note?: string) => void;
  deleteDebtPayment: (debtId: string, paymentId: string) => void;
  getDebt: (id: string) => DebtRecord | undefined;
  reloadDebts: () => void;
};

const DebtContext = createContext<DebtContextValue | undefined>(undefined);

export function DebtProvider({ children }: { children: ReactNode }) {
  const [debts, dispatch] = useReducer(debtReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const [debtLoadError, setDebtLoadError] = useState(false);
  const [debtRecovered, setDebtRecovered] = useState(false);
  const [loadToken, setLoadToken] = useState(0);
  const loadFailedRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const lastSavedDebtsRef = useRef<string>('');
  const saveQueueRef = useRef(new SaveQueue());

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let failed = false;
      let recovered = false;
      const savedDebts = await loadDebts().catch(async (err) => {
        if (err instanceof StorageParseError && (await backupUnreadableDebts())) {
          recovered = true;
          console.warn('[cashtrack] Debts were unreadable; original payload backed up');
          return null;
        }
        failed = true;
        console.error('[cashtrack] Failed to load debts', err);
        return null;
      });
      if (cancelled) return;

      loadFailedRef.current = failed;
      setDebtLoadError(failed);
      setDebtRecovered(recovered);
      const initialDebts = failed ? [] : (savedDebts ?? []);
      dispatch({ type: 'HYDRATE', debts: initialDebts });
      lastSavedDebtsRef.current = JSON.stringify(savedDebts ?? []);
      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [loadToken]);

  const reloadDebts = useCallback(() => {
    setLoadToken((token) => token + 1);
  }, []);

  const { isLoading: expenseIsLoading, registerResetHandler } = useExpenses();
  const { notifiedDebts, updateNotifiedDebts, formatAmount } = usePreferences();

  useEffect(() => {
    return registerResetHandler(async () => {
      loadFailedRef.current = false;
      setDebtLoadError(false);
      setDebtRecovered(false);
      dispatch({ type: 'HYDRATE', debts: [] });
      lastSavedDebtsRef.current = '[]';
      const success = await saveQueueRef.current.enqueue(() => saveDebts([]));
      if (!success) throw new Error('Failed to reset debts storage');
    });
  }, [registerResetHandler]);

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const currentJson = JSON.stringify(debts);
    if (shouldSave({ hasLoaded: hasLoadedRef.current, loadFailed: loadFailedRef.current, currentJson, lastSavedJson: lastSavedDebtsRef.current })) {
      void saveQueueRef.current.enqueue(() => saveDebts(debts)).then((success) => {
        if (success) {
          lastSavedDebtsRef.current = currentJson;
        }
      });
    }
  }, [debts]);

  useEffect(() => {
    if (hasLoadedRef.current && !loadFailedRef.current && !isLoading && !expenseIsLoading) {
      void checkAndTriggerDebtNotifications({
        debts,
        notifiedDebts,
        onDebtNotified: (key, dateKey) => {
          updateNotifiedDebts((current) => ({ ...current, [key]: dateKey }));
        },
        formatAmount,
      });
    }
  }, [debts, notifiedDebts, updateNotifiedDebts, formatAmount, isLoading, expenseIsLoading]);

  const addDebt = useCallback((draft: DebtDraft): DebtRecord => {
    const debt: DebtRecord = {
      ...draft,
      id: createDebtId(),
      date: draft.date ?? new Date().toISOString(),
      dueDate: draft.dueDate ?? null,
      status: 'active',
      settledDate: null,
      payments: [],
    };
    dispatch({ type: 'ADD_DEBT', debt });
    return debt;
  }, []);

  const updateDebt = useCallback((id: string, changes: DebtDraft) => {
    dispatch({ type: 'UPDATE_DEBT', id, changes });
  }, []);

  const deleteDebt = useCallback((id: string) => {
    dispatch({ type: 'DELETE_DEBT', id });
  }, []);

  const settleDebt = useCallback((id: string) => {
    const settledDate = new Date().toISOString();
    dispatch({ type: 'SETTLE_DEBT', id, settledDate });
  }, []);

  const addDebtPayment = useCallback((debtId: string, amount: number, note = '') => {
    const payment: DebtPayment = {
      id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      debtId,
      amount,
      date: new Date().toISOString(),
      note,
    };
    dispatch({ type: 'ADD_PAYMENT', debtId, payment });
  }, []);

  const deleteDebtPayment = useCallback((debtId: string, paymentId: string) => {
    dispatch({ type: 'DELETE_PAYMENT', debtId, paymentId });
  }, []);

  const getDebt = useCallback(
    (id: string) => debts.find((debt) => debt.id === id),
    [debts]
  );

  const value = useMemo(
    () => ({
      debts,
      isLoading,
      debtLoadError,
      debtRecovered,
      addDebt,
      updateDebt,
      deleteDebt,
      settleDebt,
      addDebtPayment,
      deleteDebtPayment,
      getDebt,
      reloadDebts,
    }),
    [debts, isLoading, debtLoadError, debtRecovered, addDebt, updateDebt, deleteDebt, settleDebt, addDebtPayment, deleteDebtPayment, getDebt, reloadDebts]
  );

  return <DebtContext.Provider value={value}>{children}</DebtContext.Provider>;
}

export function useDebts(): DebtContextValue {
  const context = useContext(DebtContext);
  if (!context) throw new Error('useDebts must be used inside a <DebtProvider>');
  return context;
}
