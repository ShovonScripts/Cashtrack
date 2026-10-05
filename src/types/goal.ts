export type GoalFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';

export type GoalStatus = 'active' | 'completed';

export interface MoneyGoal {
  id: string;
  title: string;
  targetAmount: number;
  startDate: string; // ISO 8601 timestamp
  deadlineDate: string; // ISO 8601 timestamp
  frequency: GoalFrequency;
  status: GoalStatus;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string; // ISO 8601 timestamp
  note: string;
}

export type GoalDraft = Pick<MoneyGoal, 'title' | 'targetAmount' | 'startDate' | 'deadlineDate' | 'frequency'>;

export type ContributionDraft = Pick<GoalContribution, 'goalId' | 'amount' | 'note'> & {
  date?: string;
};
