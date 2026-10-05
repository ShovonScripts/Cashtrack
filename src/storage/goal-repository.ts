import { initDatabase } from '@/storage/db';
import type { MoneyGoal, GoalContribution, GoalFrequency, GoalStatus } from '@/types/goal';

interface GoalRow {
  id: string;
  title: string;
  target_amount: number;
  start_date: string;
  deadline_date: string;
  frequency: string;
  status: string;
}

interface ContributionRow {
  id: string;
  goal_id: string;
  amount: number;
  date: string;
  note: string;
}

function mapGoalRow(row: GoalRow): MoneyGoal {
  return {
    id: row.id,
    title: row.title,
    targetAmount: row.target_amount,
    startDate: row.start_date,
    deadlineDate: row.deadline_date,
    frequency: row.frequency as GoalFrequency,
    status: row.status as GoalStatus,
  };
}

function mapContributionRow(row: ContributionRow): GoalContribution {
  return {
    id: row.id,
    goalId: row.goal_id,
    amount: row.amount,
    date: row.date,
    note: row.note,
  };
}

export async function getAllGoals(): Promise<MoneyGoal[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<GoalRow>('SELECT * FROM money_goals ORDER BY start_date DESC');
  return rows.map(mapGoalRow);
}

export async function getGoalById(id: string): Promise<MoneyGoal | undefined> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<GoalRow>('SELECT * FROM money_goals WHERE id = ?', id);
  return row ? mapGoalRow(row) : undefined;
}

export async function insertGoal(goal: MoneyGoal): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO money_goals (id, title, target_amount, start_date, deadline_date, frequency, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    goal.id,
    goal.title,
    goal.targetAmount,
    goal.startDate,
    goal.deadlineDate,
    goal.frequency,
    goal.status
  );
}

export async function updateGoalStatus(id: string, status: GoalStatus): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('UPDATE money_goals SET status = ? WHERE id = ?', status, id);
}

export async function deleteGoal(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM goal_contributions WHERE goal_id = ?', id);
  await db.runAsync('DELETE FROM money_goals WHERE id = ?', id);
}

export async function getContributionsForGoal(goalId: string): Promise<GoalContribution[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<ContributionRow>(
    'SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY date DESC',
    goalId
  );
  return rows.map(mapContributionRow);
}

export async function getAllContributions(): Promise<GoalContribution[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<ContributionRow>('SELECT * FROM goal_contributions ORDER BY date DESC');
  return rows.map(mapContributionRow);
}

export async function insertContribution(contribution: GoalContribution): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    'INSERT INTO goal_contributions (id, goal_id, amount, date, note) VALUES (?, ?, ?, ?, ?)',
    contribution.id,
    contribution.goalId,
    contribution.amount,
    contribution.date,
    contribution.note
  );
}

export async function deleteContribution(id: string): Promise<void> {
  const db = await initDatabase();
  await db.runAsync('DELETE FROM goal_contributions WHERE id = ?', id);
}
