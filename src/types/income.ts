export interface IncomeRecord {
  id: string;
  amount: number;
  date: string; // ISO 8601 timestamp
  note: string;
}

export type IncomeDraft = Pick<IncomeRecord, 'amount' | 'note'> & {
  date?: string;
};
