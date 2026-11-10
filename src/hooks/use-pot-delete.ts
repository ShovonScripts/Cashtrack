import { useCallback } from 'react';

import { usePreferences } from '@/context/expense-context';
import { useGoals } from '@/context/goal-context';
import { useToast } from '@/context/toast-context';
import type { GoalContribution } from '@/types/goal';

/**
 * Deleting a pot or a contribution hides it at once and shows an Undo toast.
 * The record is only removed when the toast closes, so Undo never rewrites data.
 */
export function usePotDelete() {
  const toast = useToast();
  const { formatAmount } = usePreferences();
  const { deleteGoal, deleteContribution, hidePendingDelete, releasePendingDelete } = useGoals();

  const deletePot = useCallback(
    (pot: { id: string; title: string }, onDone?: () => void) => {
      hidePendingDelete(pot.id);
      toast.show({
        message: `Deleted pot "${pot.title}"`,
        actionLabel: 'Undo',
        onAction: () => releasePendingDelete(pot.id),
        onExpire: () => {
          deleteGoal(pot.id)
            .catch((error) => console.error('[cashtrack] Failed to delete pot', error))
            .finally(() => releasePendingDelete(pot.id));
        },
      });
      onDone?.();
    },
    [deleteGoal, hidePendingDelete, releasePendingDelete, toast]
  );

  const deletePotContribution = useCallback(
    (contribution: GoalContribution) => {
      hidePendingDelete(contribution.id);
      toast.show({
        message: `Removed ${formatAmount(contribution.amount)} from the pot`,
        actionLabel: 'Undo',
        onAction: () => releasePendingDelete(contribution.id),
        onExpire: () => {
          deleteContribution(contribution.id)
            .catch((error) => console.error('[cashtrack] Failed to delete contribution', error))
            .finally(() => releasePendingDelete(contribution.id));
        },
      });
    },
    [deleteContribution, formatAmount, hidePendingDelete, releasePendingDelete, toast]
  );

  return { deletePot, deletePotContribution };
}
