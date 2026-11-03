import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useToast } from '@/context/toast-context';
import { confirmDelete } from '@/utils/confirm';
import { useExpenses, usePreferences } from '@/context/expense-context';
import type { Expense } from '@/types/expense';

type UndoDeleteContextValue = {
  /** Ids hidden from lists while their Undo window is open. */
  pendingDeleteIds: ReadonlySet<string>;
  /** Hides the expense now and deletes it for real once the Undo window closes. */
  requestDelete: (expense: Expense) => void;
};

/** Recurring templates also remove every occurrence they created, so they keep the confirm dialog. */
export function canUndoDelete(expense: Pick<Expense, 'isRecurring' | 'recurringParentId'>): boolean {
  return !(expense.isRecurring && !expense.recurringParentId);
}

const UndoDeleteContext = createContext<UndoDeleteContextValue | null>(null);

/**
 * Deleting is delayed instead of confirmed: the row disappears at once, a toast
 * offers Undo, and the record is only removed when the toast expires. Undo
 * simply un-hides it, so no data is ever rewritten.
 */
export function UndoDeleteProvider({ children }: { children: ReactNode }) {
  const toast = useToast();
  const { deleteExpense } = useExpenses();
  const { formatAmount } = usePreferences();
  const [pendingDeleteIds, setPendingDeleteIds] = useState<ReadonlySet<string>>(() => new Set());

  const release = useCallback((id: string) => {
    setPendingDeleteIds((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const requestDelete = useCallback(
    (expense: Expense) => {
      setPendingDeleteIds((current) => new Set(current).add(expense.id));
      const label = expense.note?.trim() || expense.category;
      toast.show({
        message: `Deleted ${label} (${formatAmount(expense.amount)})`,
        actionLabel: 'Undo',
        onAction: () => release(expense.id),
        onExpire: () => {
          deleteExpense(expense.id)
            .catch((error) => console.error('[cashtrack] Failed to delete expense', error))
            .finally(() => release(expense.id));
        },
      });
    },
    [deleteExpense, formatAmount, release, toast]
  );

  const value = useMemo(() => ({ pendingDeleteIds, requestDelete }), [pendingDeleteIds, requestDelete]);

  return <UndoDeleteContext.Provider value={value}>{children}</UndoDeleteContext.Provider>;
}

/**
 * One delete behaviour for every screen: Undo toast for ordinary expenses, and
 * a confirm dialog for recurring templates (which also remove their occurrences).
 * `onDone` runs once the delete is requested, for example to leave the screen.
 */
export function useDeleteExpenseFlow() {
  const { requestDelete } = useUndoDelete();
  const { deleteExpense } = useExpenses();

  return useCallback(
    (expense: Expense, onDone?: () => void) => {
      if (canUndoDelete(expense)) {
        requestDelete(expense);
        onDone?.();
        return;
      }
      confirmDelete(
        'Delete recurring expense?',
        'This also removes every expense it created. This cannot be undone.',
        async () => {
          await deleteExpense(expense.id);
          onDone?.();
        }
      );
    },
    [deleteExpense, requestDelete]
  );
}

export function useUndoDelete(): UndoDeleteContextValue {
  const context = useContext(UndoDeleteContext);
  if (!context) throw new Error('useUndoDelete must be used inside an <UndoDeleteProvider>');
  return context;
}
