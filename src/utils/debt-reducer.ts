import type { DebtRecord, DebtDraft, DebtPayment } from '@/types/debt';
import { getTotalPaid } from './debt.ts';

/**
 * Pure reducer for the debt store. Extracted from the context provider so the
 * settlement and payment rules can be unit-tested without React or native modules.
 */
export type DebtAction =
  | { type: 'HYDRATE'; debts: DebtRecord[] }
  | { type: 'ADD_DEBT'; debt: DebtRecord }
  | { type: 'UPDATE_DEBT'; id: string; changes: DebtDraft }
  | { type: 'DELETE_DEBT'; id: string }
  | { type: 'SETTLE_DEBT'; id: string; settledDate: string }
  | { type: 'ADD_PAYMENT'; debtId: string; payment: DebtPayment }
  | { type: 'DELETE_PAYMENT'; debtId: string; paymentId: string };

export function debtReducer(state: DebtRecord[], action: DebtAction): DebtRecord[] {
  switch (action.type) {
    case 'HYDRATE':
      return action.debts;
    case 'ADD_DEBT':
      return [action.debt, ...state];
    case 'UPDATE_DEBT':
      return state.map((debt) =>
        debt.id === action.id
          ? {
              ...debt,
              ...action.changes,
              date: action.changes.date ?? debt.date,
              dueDate: action.changes.dueDate !== undefined ? action.changes.dueDate : debt.dueDate,
            }
          : debt
      );
    case 'DELETE_DEBT':
      return state.filter((debt) => debt.id !== action.id);
    case 'SETTLE_DEBT':
      // Idempotent: re-settling an already-settled debt must not add payments or
      // overwrite the original settled date.
      return state.map((debt) =>
        debt.id === action.id && debt.status !== 'settled'
          ? { ...debt, status: 'settled', settledDate: action.settledDate }
          : debt
      );
    case 'ADD_PAYMENT': {
      return state.map((debt) => {
        if (debt.id !== action.debtId) return debt;
        const newPayments = [action.payment, ...(debt.payments ?? [])];
        const isNowSettled = getTotalPaid({ ...debt, payments: newPayments }) >= debt.amount;
        return {
          ...debt,
          payments: newPayments,
          status: isNowSettled ? ('settled' as const) : debt.status,
          settledDate: isNowSettled && !debt.settledDate ? new Date().toISOString() : debt.settledDate,
        };
      });
    }
    case 'DELETE_PAYMENT': {
      return state.map((debt) => {
        if (debt.id !== action.debtId) return debt;
        const newPayments = (debt.payments ?? []).filter((p) => p.id !== action.paymentId);
        const totalPaid = getTotalPaid({ ...debt, payments: newPayments });
        return {
          ...debt,
          payments: newPayments,
          status: totalPaid >= debt.amount ? 'settled' : 'active',
          settledDate: totalPaid >= debt.amount ? debt.settledDate : null,
        };
      });
    }
    default:
      return state;
  }
}
