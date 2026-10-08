import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
import { processRecurringIncome } from '@/utils/recurring-income';
import { useExpenses } from '@/context/expense-context';

type IncomeContextValue = {
  incomeList: IncomeRecord[];
  isLoading: boolean;
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
  const { registerResetHandler } = useExpenses();

  useEffect(() => {
    return registerResetHandler(async () => {
      setIncomeList([]);
    });
  }, [registerResetHandler]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await getAllIncome();
        const processed = processRecurringIncome(rows);
        if (!cancelled) {
          setIncomeList(processed);
        }
      } catch (error) {
        console.error('[cashtrack] Failed to load income transactions', error);
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

    setIncomeList((current) => processRecurringIncome([record, ...current]));
    return record;
  }, []);

  const updateIncome = useCallback(async (id: string, changes: IncomeDraft) => {
    await updateIncomeRepo(id, changes);
    setIncomeList((current) =>
      processRecurringIncome(
        current.map((item) =>
          item.id === id
            ? {
                ...item,
                amount: changes.amount,
                note: changes.note ?? item.note,
                isRecurring: changes.isRecurring ?? item.isRecurring,
                recurringFrequency: changes.recurringFrequency ?? item.recurringFrequency,
                recurringEndDate: changes.recurringEndDate ?? item.recurringEndDate,
              }
            : item
        )
      )
    );
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    await deleteIncomeRepo(id);
    setIncomeList((current) => current.filter((item) => item.id !== id && item.recurringParentId !== id));
  }, []);

  const getIncome = useCallback(
    (id: string) => incomeList.find((item) => item.id === id),
    [incomeList]
  );

  const value = useMemo(
    () => ({
      incomeList,
      isLoading,
      addIncome,
      updateIncome,
      deleteIncome,
      getIncome,
    }),
    [incomeList, isLoading, addIncome, updateIncome, deleteIncome, getIncome]
  );

  return <IncomeContext.Provider value={value}>{children}</IncomeContext.Provider>;
}

export function useIncome(): IncomeContextValue {
  const context = useContext(IncomeContext);
  if (!context) throw new Error('useIncome must be used inside an <IncomeProvider>');
  return context;
}
