import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MoneyGoal, GoalContribution, GoalStatus } from '@/types/goal';

const GOALS_KEY = '@cashtrack/goals';
const CONTRIBUTIONS_KEY = '@cashtrack/goal-contributions';

export async function getAllGoals(): Promise<MoneyGoal[]> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return parsed.map((g: any) => ({
      ...g,
      potType: g.potType ?? 'general',
      allocationType: g.allocationType ?? 'manual',
      allocationPercent: g.allocationPercent ?? null,
      icon: g.icon ?? 'piggy-bank',
    }));
  } catch {
    return [];
  }
}

export async function getGoalById(id: string): Promise<MoneyGoal | undefined> {
  const goals = await getAllGoals();
  return goals.find((g) => g.id === id);
}

export async function insertGoal(goal: MoneyGoal): Promise<void> {
  const goals = await getAllGoals();
  const next = [goal, ...goals.filter((g) => g.id !== goal.id)];
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(next));
}

export async function updateGoal(goal: MoneyGoal): Promise<void> {
  const goals = await getAllGoals();
  const next = goals.map((g) => (g.id === goal.id ? goal : g));
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(next));
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const goals = await getAllGoals();
  const next = goals.map((g) => (g.id === id ? { ...g, status } : g));
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(next));
}

export async function deleteGoal(id: string): Promise<void> {
  const goals = await getAllGoals();
  const nextGoals = goals.filter((g) => g.id !== id);
  await AsyncStorage.setItem(GOALS_KEY, JSON.stringify(nextGoals));

  const contribs = await getAllContributions();
  const nextContribs = contribs.filter((c) => c.goalId !== id);
  await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(nextContribs));
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const contribs = await getAllContributions();
  return contribs.filter((c) => c.goalId === goalId);
}

export async function getAllContributions(): Promise<GoalContribution[]> {
  try {
    const raw = await AsyncStorage.getItem(CONTRIBUTIONS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function insertContribution(contribution: GoalContribution): Promise<void> {
  const contribs = await getAllContributions();
  const next = [contribution, ...contribs.filter((c) => c.id !== contribution.id)];
  await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(next));
}

export async function deleteContribution(id: string): Promise<void> {
  const contribs = await getAllContributions();
  const next = contribs.filter((c) => c.id !== id);
  await AsyncStorage.setItem(CONTRIBUTIONS_KEY, JSON.stringify(next));
}
