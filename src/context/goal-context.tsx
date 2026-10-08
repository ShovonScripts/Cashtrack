import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { MoneyGoal, GoalContribution, GoalDraft, ContributionDraft, GoalStatus } from '@/types/goal';
import {
  getAllGoals,
  insertGoal,
  updateGoalStatus as updateGoalStatusRepo,
  deleteGoal as deleteGoalRepo,
  getAllContributions,
  insertContribution,
  deleteContribution as deleteContributionRepo,
} from '@/storage/goal-repository';
import { calculateGoalProgress } from '@/utils/goal-calculator';
import { useExpenses } from '@/context/expense-context';

export type GoalWithProgress = MoneyGoal & {
  contributedAmount: number;
  remainingAmount: number;
  progressPercent: number;
  aheadBehindAmount: number;
  isCompleted: boolean;
  contributions: GoalContribution[];
};

type GoalContextValue = {
  goals: GoalWithProgress[];
  allContributions: GoalContribution[];
  isLoading: boolean;
  addGoal: (draft: GoalDraft) => Promise<MoneyGoal>;
  updateGoalStatus: (id: string, status: GoalStatus) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addContribution: (draft: ContributionDraft) => Promise<GoalContribution>;
  deleteContribution: (id: string) => Promise<void>;
  getGoal: (id: string) => GoalWithProgress | undefined;
};

const GoalContext = createContext<GoalContextValue | undefined>(undefined);

let goalIdCounter = 0;
function createGoalId(): string {
  goalIdCounter += 1;
  return `goal-${Date.now().toString(36)}-${goalIdCounter}`;
}

let contributionIdCounter = 0;
function createContributionId(): string {
  contributionIdCounter += 1;
  return `contrib-${Date.now().toString(36)}-${contributionIdCounter}`;
}

export function GoalProvider({ children }: { children: ReactNode }) {
  const [rawGoals, setRawGoals] = useState<MoneyGoal[]>([]);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { registerResetHandler } = useExpenses();

  useEffect(() => {
    return registerResetHandler(async () => {
      setRawGoals([]);
      setContributions([]);
    });
  }, [registerResetHandler]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [loadedGoals, loadedContribs] = await Promise.all([
          getAllGoals(),
          getAllContributions(),
        ]);
        if (!cancelled) {
          setRawGoals(loadedGoals);
          setContributions(loadedContribs);
        }
      } catch (error) {
        console.error('[cashtrack] Failed to load goals and contributions', error);
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

  const goals = useMemo<GoalWithProgress[]>(() => {
    const today = new Date();
    return rawGoals.map((goal) => {
      const goalContribs = contributions.filter((c) => c.goalId === goal.id);
      const contributedAmount = goalContribs.reduce((sum, c) => sum + c.amount, 0);

      const calc = calculateGoalProgress({
        targetAmount: goal.targetAmount,
        startDate: goal.startDate,
        deadlineDate: goal.deadlineDate,
        currentAmount: contributedAmount,
        frequency: goal.frequency,
        today,
      });

      const progressPercent = goal.targetAmount > 0 ? Math.min(100, (contributedAmount / goal.targetAmount) * 100) : 0;

      return {
        ...goal,
        contributedAmount,
        remainingAmount: calc.remainingAmount,
        progressPercent,
        aheadBehindAmount: calc.aheadBehindAmount,
        isCompleted: calc.isCompleted || goal.status === 'completed',
        contributions: goalContribs,
      };
    });
  }, [rawGoals, contributions]);

  const addGoal = useCallback(async (draft: GoalDraft): Promise<MoneyGoal> => {
    const goal: MoneyGoal = {
      id: createGoalId(),
      title: draft.title.trim(),
      targetAmount: draft.targetAmount,
      startDate: draft.startDate,
      deadlineDate: draft.deadlineDate,
      frequency: draft.frequency,
      status: 'active',
      potType: draft.potType ?? 'general',
      allocationType: draft.allocationType ?? 'manual',
      allocationPercent: draft.allocationPercent ?? null,
      icon: draft.icon ?? 'piggy-bank',
    };
    await insertGoal(goal);
    setRawGoals((current) => [goal, ...current]);
    return goal;
  }, []);

  const updateGoalStatus = useCallback(async (id: string, status: GoalStatus) => {
    await updateGoalStatusRepo(id, status);
    setRawGoals((current) =>
      current.map((g) => (g.id === id ? { ...g, status } : g))
    );
  }, []);

  const deleteGoal = useCallback(async (id: string) => {
    await deleteGoalRepo(id);
    setRawGoals((current) => current.filter((g) => g.id !== id));
    setContributions((current) => current.filter((c) => c.goalId !== id));
  }, []);

  const addContribution = useCallback(async (draft: ContributionDraft): Promise<GoalContribution> => {
    const contribution: GoalContribution = {
      id: createContributionId(),
      goalId: draft.goalId,
      amount: draft.amount,
      date: draft.date ?? new Date().toISOString(),
      note: draft.note?.trim() ?? '',
    };
    await insertContribution(contribution);
    setContributions((current) => [contribution, ...current]);
    return contribution;
  }, []);

  const deleteContribution = useCallback(async (id: string) => {
    await deleteContributionRepo(id);
    setContributions((current) => current.filter((c) => c.id !== id));
  }, []);

  const getGoal = useCallback(
    (id: string) => goals.find((g) => g.id === id),
    [goals]
  );

  const value = useMemo(
    () => ({
      goals,
      allContributions: contributions,
      isLoading,
      addGoal,
      updateGoalStatus,
      deleteGoal,
      addContribution,
      deleteContribution,
      getGoal,
    }),
    [goals, contributions, isLoading, addGoal, updateGoalStatus, deleteGoal, addContribution, deleteContribution, getGoal]
  );

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
}

export function useGoals(): GoalContextValue {
  const context = useContext(GoalContext);
  if (!context) throw new Error('useGoals must be used inside a <GoalProvider>');
  return context;
}
