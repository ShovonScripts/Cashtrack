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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await getAllIncome();
        if (!cancelled) {
          setIncomeList(rows);
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
    };
    await insertIncome(record);
    setIncomeList((current) => [record, ...current]);
    return record;
  }, []);

  const updateIncome = useCallback(async (id: string, changes: IncomeDraft) => {
    await updateIncomeRepo(id, changes);
    setIncomeList((current) =>
      current.map((item) =>
        item.id === id
          ? {
              ...item,
              amount: changes.amount,
              note: changes.note ?? item.note,
            }
          : item
      )
    );
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    await deleteIncomeRepo(id);
    setIncomeList((current) => current.filter((item) => item.id !== id));
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
