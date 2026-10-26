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

import type { GoalContribution } from '@/types/goal';
import type { IncomeRecord, IncomeDraft } from '@/types/income';
import {
  getAllIncome,
  insertIncome,
  updateIncome as updateIncomeRepo,
  deleteIncome as deleteIncomeRepo,
} from '@/storage/income-repository';
import {
  deleteContributionsForIncome,
  getAllContributions,
  getAllGoals,
  insertContributions,
} from '@/storage/goal-repository';
import { calculateIncomeAllocations, type AllocationResult } from '@/utils/savings-allocator';
import { notifyGoalDataChanged } from '@/utils/goal-events';
import { applyIncomeUpdate, constrainIncomeEdit } from '@/utils/income';
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

let contributionIdCounter = 0;
function createAutoContribution(income: IncomeRecord, allocation: AllocationResult): GoalContribution {
  contributionIdCounter += 1;
  return {
    id: `contrib-auto-${Date.now().toString(36)}-${contributionIdCounter}-${Math.random().toString(36).slice(2, 6)}`,
    goalId: allocation.goalId,
    amount: allocation.amount,
    date: income.date,
    note: allocation.note,
    sourceIncomeId: income.id,
  };
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
    async (processed: IncomeRecord[], knownIds: Set<string>): Promise<IncomeRecord[]> => {
      const inserted: IncomeRecord[] = [];
      for (const row of processed) {
        if (knownIds.has(row.id)) continue;
        try {
          await insertIncome(row);
          inserted.push(row);
        } catch (error) {
          console.error('[cashtrack] Failed to persist recurring income occurrence', error);
        }
      }
      return inserted;
    },
    []
  );

  const allocateIncomeBatch = useCallback(async (records: readonly IncomeRecord[]) => {
    if (records.length === 0) return;
    try {
      const [goals, existing] = await Promise.all([getAllGoals(), getAllContributions()]);
      let contributions = existing;
      const additions: GoalContribution[] = [];

      for (const record of records) {
        const allocations = calculateIncomeAllocations(record, goals, contributions);
        const created = allocations.map((allocation) => createAutoContribution(record, allocation));
        additions.push(...created);
        contributions = [...created, ...contributions];
      }

      await insertContributions(additions);
      if (additions.length > 0) {
        notifyGoalDataChanged();
      }
    } catch (error) {
      console.error('[cashtrack] Failed to auto-allocate savings from income', error);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rows = await getAllIncome();
        const skipped = await loadRecurringSkips('income').catch(() => ({}));
        skippedRef.current = skipped;

        const processed = processRecurringIncome(rows, skipped);
        const inserted = await persistGeneratedIncome(processed, new Set(rows.map((row) => row.id)));
        await allocateIncomeBatch(inserted);
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
  }, [persistGeneratedIncome, allocateIncomeBatch, loadToken]);

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

    const current = incomeListRef.current;
    const next = processRecurringIncome([record, ...current], skippedRef.current);
    const inserted = await persistGeneratedIncome(
      next,
      new Set([record.id, ...current.map((item) => item.id)])
    );

    // Auto-allocate savings to percentage-based goals/pots.
    await allocateIncomeBatch([record, ...inserted]);

    setIncomeList(next);
    return record;
  }, [persistGeneratedIncome, allocateIncomeBatch]);

  const updateIncome = useCallback(async (id: string, changes: IncomeDraft) => {
    const current = incomeListRef.current;
    const existing = current.find((item) => item.id === id);
    if (!existing) {
      await updateIncomeRepo(id, changes);
      return;
    }

    const constrainedChanges = constrainIncomeEdit(existing, changes);
    const updated = applyIncomeUpdate(existing, constrainedChanges);
    await updateIncomeRepo(id, constrainedChanges);
    const next = processRecurringIncome(
      current.map((item) => (item.id === id ? updated : item)),
      skippedRef.current
    );
    const inserted = await persistGeneratedIncome(next, new Set(current.map((item) => item.id)));

    // Recompute this income's auto-save so edits cannot leave stale amounts.
    // If the old allocations cannot be cleared, skip re-allocating to avoid
    // double-counting them.
    let clearedStaleAllocations = true;
    try {
      await deleteContributionsForIncome([id]);
      notifyGoalDataChanged();
    } catch (error) {
      clearedStaleAllocations = false;
      console.error('[cashtrack] Failed to clear stale auto-allocations', error);
    }
    if (clearedStaleAllocations) {
      await allocateIncomeBatch([updated, ...inserted]);
    }

    setIncomeList(next);
  }, [persistGeneratedIncome, allocateIncomeBatch]);

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

    const removedIds = [
      id,
      ...current.filter((item) => item.recurringParentId === id).map((item) => item.id),
    ];
    await deleteIncomeRepo(id);

    try {
      await deleteContributionsForIncome(removedIds);
      notifyGoalDataChanged();
    } catch (error) {
      console.error('[cashtrack] Failed to remove auto-allocations for deleted income', error);
    }

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
