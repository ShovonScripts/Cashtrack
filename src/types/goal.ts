export type GoalFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'half-yearly'
  | 'yearly';

export type GoalStatus = 'active' | 'completed';
export type PotType = 'general' | 'emergency' | 'children' | 'piggy_bank' | 'dream';
export type AllocationType = 'manual' | 'percentage' | 'flexible';

export interface MoneyGoal {
  id: string;
  title: string;
  targetAmount: number;
  startDate: string; // ISO 8601 timestamp
  deadlineDate?: string | null; // ISO 8601 timestamp (optional for flexible pots)
  frequency: GoalFrequency;
  status: GoalStatus;
  potType: PotType;
  allocationType: AllocationType;
  allocationPercent: number | null; // e.g. 10 for 10%
  icon: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string; // ISO 8601 timestamp
  note: string;
}

export type GoalDraft = Pick<MoneyGoal, 'title' | 'targetAmount' | 'startDate' | 'frequency' | 'potType' | 'allocationType' | 'allocationPercent' | 'icon'> & {
  deadlineDate?: string | null;
};

export type ContributionDraft = Pick<GoalContribution, 'goalId' | 'amount' | 'note'> & {
  date?: string;
};
