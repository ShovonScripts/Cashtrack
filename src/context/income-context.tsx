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

import type { IncomeRecord, IncomeDraft } from '@/types/income';
import {
  getAllIncome,
  insertIncome,
  updateIncome as updateIncomeRepo,
  deleteIncome as deleteIncomeRepo,
} from '@/storage/income-repository';
import { getAllGoals, insertContribution } from '@/storage/goal-repository';
import { calculateIncomeAllocations } from '@/utils/savings-allocator';
import { applyIncomeUpdate } from '@/utils/income';
import { getRecurringPeriodKey } from '@/utils/recurring';
import { processRecurringIncome } from '@/utils/recurring-income';
import { loadRecurringSkips, skipRecurringPeriod } from '@/storage/recurring-skips';
import { useExpenses } from '@/context/expense-context';

type IncomeContextValue = {
  incomeList: IncomeRecord[];
  isLoading: boolean;
  incomeLoadError: boolean;
  reloadIncome: () => void;
  addIncome: (draft: IncomeDraft) => Promise<IncomeRecord>;
  updateIncome: (id: string, changes: IncomeDraft) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  getIncome: (id: string) => IncomeRecord | undefined;
};

const IncomeContext = createContext<IncomeContextValue | undefined>(undefined);

let incomeIdCounter = 0;
function createIncomeId(): string {
  incomeIdCounter += 1;
  return `income-${Date.now().toString(36)}-${incomeIdCounter}`;
}

export function IncomeProvider({ children }: { children: ReactNode }) {
  const [incomeList, setIncomeList] = useState<IncomeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [incomeLoadError, setIncomeLoadError] = useState(false);
  const [loadToken, setLoadToken] = useState(0);
  const incomeListRef = useRef<IncomeRecord[]>([]);
  const skippedRef = useRef<Record<string, Set<string>>>({});
  const { registerResetHandler } = useExpenses();

  useEffect(() => {
    incomeListRef.current = incomeList;
  }, [incomeList]);

  useEffect(() => {
    return registerResetHandler(async () => {
      skippedRef.current = {};
      setIncomeList([]);
    });
  }, [registerResetHandler]);

  const persistGeneratedIncome = useCallback(
    async (processed: IncomeRecord[], knownIds: Set<string>) => {
      for (const row of processed) {
        if (knownIds.has(row.id)) continue;
        try {
          await insertIncome(row);
        } catch (error) {
          console.error('[cashtrack] Failed to persist recurring income occurrence', error);
        }
      }
    },
    []
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await getAllIncome();
        const skipped = await loadRecurringSkips('income').catch(() => ({}));
        skippedRef.current = skipped;

        const processed = processRecurringIncome(rows, skipped);
        await persistGeneratedIncome(processed, new Set(rows.map((row) => row.id)));
        if (!cancelled) {
          setIncomeList(processed);
          setIncomeLoadError(false);
        }
      } catch (error) {
        console.error('[cashtrack] Failed to load income transactions', error);
        if (!cancelled) setIncomeLoadError(true);
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
  }, [persistGeneratedIncome, loadToken]);

  const reloadIncome = useCallback(() => {
    setIsLoading(true);
    setLoadToken((token) => token + 1);
  }, []);

  const addIncome = useCallback(async (draft: IncomeDraft): Promise<IncomeRecord> => {
    const record: IncomeRecord = {
      id: createIncomeId(),
      amount: draft.amount,
      date: draft.date ?? new Date().toISOString(),
      note: draft.note ?? '',
      isRecurring: draft.isRecurring ?? false,
      recurringFrequency: draft.recurringFrequency,
      recurringEndDate: draft.recurringEndDate,
    };
    await insertIncome(record);

    // Auto-allocate savings to percentage-based goals/pots
    try {
      const goals = await getAllGoals();
      const allocations = calculateIncomeAllocations(record, goals);
      for (const alloc of allocations) {
        const contribution = {
          id: `contrib-auto-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`,
          goalId: alloc.goalId,
          amount: alloc.amount,
          date: record.date,
          note: alloc.note,
        };
        await insertContribution(contribution);
      }
    } catch (err) {
      console.error('[cashtrack] Failed to auto-allocate savings from income', err);
    }

    const current = incomeListRef.current;
    const next = processRecurringIncome([record, ...current], skippedRef.current);
    await persistGeneratedIncome(next, new Set([record.id, ...current.map((item) => item.id)]));
    setIncomeList(next);
    return record;
  }, [persistGeneratedIncome]);

  const updateIncome = useCallback(async (id: string, changes: IncomeDraft) => {
    await updateIncomeRepo(id, changes);
    const current = incomeListRef.current;
    const next = processRecurringIncome(
      current.map((item) => (item.id === id ? applyIncomeUpdate(item, changes) : item)),
      skippedRef.current
    );
    await persistGeneratedIncome(next, new Set(current.map((item) => item.id)));
    setIncomeList(next);
  }, [persistGeneratedIncome]);

  const deleteIncome = useCallback(async (id: string) => {
    const current = incomeListRef.current;
    const target = current.find((item) => item.id === id);
    const parent = target?.recurringParentId
      ? current.find((item) => item.id === target.recurringParentId)
      : undefined;

    if (target?.recurringParentId && parent?.recurringFrequency) {
      const periodKey = getRecurringPeriodKey(new Date(target.date), parent.recurringFrequency);
      try {
        await skipRecurringPeriod('income', parent.id, periodKey);
        skippedRef.current = {
          ...skippedRef.current,
          [parent.id]: new Set([...(skippedRef.current[parent.id] ?? []), periodKey]),
        };
      } catch (error) {
        console.error('[cashtrack] Failed to remember deleted recurring income', error);
      }
    }

    await deleteIncomeRepo(id);
    setIncomeList((list) => list.filter((item) => item.id !== id && item.recurringParentId !== id));
  }, []);

  const getIncome = useCallback(
    (id: string) => incomeList.find((item) => item.id === id),
    [incomeList]
  );

  const value = useMemo(
    () => ({
      incomeList,
      isLoading,
      incomeLoadError,
      reloadIncome,
      addIncome,
      updateIncome,
      deleteIncome,
      getIncome,
    }),
    [incomeList, isLoading, incomeLoadError, reloadIncome, addIncome, updateIncome, deleteIncome, getIncome]
  );

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
}

export function useIncome(): IncomeContextValue {
  const context = useContext(IncomeContext);
  if (!context) throw new Error('useIncome must be used inside an <IncomeProvider>');
  return context;
}
