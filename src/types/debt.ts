export type DebtType = 'lent' | 'borrowed';
export type DebtStatus = 'active' | 'settled';

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  date: string; // ISO 8601 timestamp
  note: string;
}

export interface DebtRecord {
  id: string;
  personName: string;
  amount: number;
  type: DebtType;
  /** ISO 8601 timestamp */
  date: string;
  dueDate?: string | null;
  status: DebtStatus;
  note: string;
  settledDate?: string | null;
  payments?: DebtPayment[];
}

export type DebtDraft = Pick<DebtRecord, 'personName' | 'amount' | 'type' | 'note'> & {
  date?: string;
  dueDate?: string | null;
};
