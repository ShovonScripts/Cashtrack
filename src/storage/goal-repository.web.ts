import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoneyGoal, GoalContribution, GoalStatus } from '@/types/goal';
import { mapGoalRow } from '@/storage/goal-rows';
import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';

const GOALS_KEY = '@cashtrack/goals';
const CONTRIBUTIONS_KEY = '@cashtrack/goal-contributions';

const contributionRows = objectRows<GoalContribution>('goal contributions');

export async function getAllGoals(): Promise<MoneyGoal[]> {
  return readJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow);
}

export async function getGoalById(id: string): Promise<MoneyGoal | undefined> {
  const goals = await getAllGoals();
  return goals.find((g) => g.id === id);
}

export async function insertGoal(goal: MoneyGoal): Promise<void> {
  await mutateJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow, (goals) => [
    goal,
    ...goals.filter((g) => g.id !== goal.id),
  ]);
}

export async function updateGoal(goal: MoneyGoal): Promise<void> {
  await mutateJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow, (goals) =>
    goals.map((g) => (g.id === goal.id ? goal : g))
  );
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  await mutateJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow, (goals) =>
    goals.map((g) => (g.id === id ? { ...g, status } : g))
  );
}

export async function deleteGoal(id: string): Promise<void> {
  let removedContributions: GoalContribution[] = [];

  await mutateJsonArray(
    AsyncStorage,
    CONTRIBUTIONS_KEY,
    'goal contributions',
    contributionRows,
    (contribs) => {
      removedContributions = contribs.filter((c) => c.goalId === id);
      return contribs.filter((c) => c.goalId !== id);
    },
  );

  try {
    await mutateJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow, (goals) =>
      goals.filter((g) => g.id !== id)
    );
  } catch (error) {
    // AsyncStorage has no cross-key transaction. If the goal write fails, put
    // the contributions back so an existing goal does not lose its progress.
    if (removedContributions.length > 0) {
      const restored = removedContributions;
      await mutateJsonArray(
        AsyncStorage,
        CONTRIBUTIONS_KEY,
        'goal contributions',
        contributionRows,
        (contribs) => {
          const ids = new Set(contribs.map((c) => c.id));
          return [...restored.filter((c) => !ids.has(c.id)), ...contribs];
        },
      ).catch((rollbackError) => {
        console.error('[cashtrack] Failed to roll back goal contributions', rollbackError);
      });
    }
    throw error;
  }
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const contribs = await getAllContributions();
  return contribs.filter((c) => c.goalId === goalId);
}

export async function getAllContributions(): Promise<GoalContribution[]> {
  return readJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows);
}

export async function insertContribution(contribution: GoalContribution): Promise<void> {
  await insertContributions([contribution]);
}

export async function insertContributions(contributions: readonly GoalContribution[]): Promise<void> {
  if (contributions.length === 0) return;
  const ids = new Set(contributions.map((c) => c.id));
  await mutateJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows, (contribs) => [
    ...contributions,
    ...contribs.filter((c) => !ids.has(c.id)),
  ]);
}

export async function deleteContribution(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows, (contribs) =>
    contribs.filter((c) => c.id !== id)
  );
}

export async function deleteContributionsForIncome(incomeIds: readonly string[]): Promise<void> {
  if (incomeIds.length === 0) return;
  const ids = new Set(incomeIds);
  await mutateJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows, (contribs) =>
    contribs.filter((c) => !c.sourceIncomeId || !ids.has(c.sourceIncomeId))
  );
}
