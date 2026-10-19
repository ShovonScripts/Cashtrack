import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoneyGoal, GoalContribution, GoalStatus } from '@/types/goal';
import { mapGoalRow } from '@/storage/goal-rows';
import { mutateJsonArray, objectRows, readJsonArray, writeJsonArray } from '@/storage/json-collection';

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
  const goals = await readJsonArray(AsyncStorage, GOALS_KEY, 'goals', mapGoalRow);
  const contribs = await readJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows);
  await writeJsonArray(AsyncStorage, GOALS_KEY, goals.filter((g) => g.id !== id));
  await writeJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, contribs.filter((c) => c.goalId !== id));
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const contribs = await getAllContributions();
  return contribs.filter((c) => c.goalId === goalId);
}

export async function getAllContributions(): Promise<GoalContribution[]> {
  return readJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows);
}

export async function insertContribution(contribution: GoalContribution): Promise<void> {
  await mutateJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows, (contribs) => [
    contribution,
    ...contribs.filter((c) => c.id !== contribution.id),
  ]);
}

export async function deleteContribution(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, CONTRIBUTIONS_KEY, 'goal contributions', contributionRows, (contribs) =>
    contribs.filter((c) => c.id !== id)
  );
}
