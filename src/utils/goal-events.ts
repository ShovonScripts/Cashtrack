type GoalChangeListener = () => void;

const listeners = new Set<GoalChangeListener>();

/**
 * Income auto-save writes contributions straight to storage, outside the goal
 * context. Subscribers can refresh their in-memory goal data after such writes.
 */
export function subscribeToGoalChanges(listener: GoalChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyGoalDataChanged(): void {
  for (const listener of [...listeners]) {
    listener();
  }
}
