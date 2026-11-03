export const NEAR_LIMIT_RATIO = 0.8;

export type BudgetState = 'ok' | 'near' | 'over';

export type BudgetStatus = {
  state: BudgetState;
  /** Real percentage of the limit used. Can exceed 100. */
  percent: number;
  /** Fill ratio for a progress bar, clamped to 0..1. */
  fill: number;
  /** Money left; negative when over the limit. */
  remaining: number;
  label: string;
};

const LABELS: Record<BudgetState, string> = {
  ok: 'On track',
  near: 'Near limit',
  over: 'Over limit',
};

/**
 * Classifies spending against a monthly cap.
 * Spending exactly at the cap is "near", and only going past it is "over",
 * which matches the Spending Advisor so both screens always agree.
 */
export function getBudgetStatus(spent: number, limit: number): BudgetStatus {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 0;
  const safeSpent = Number.isFinite(spent) && spent > 0 ? spent : 0;
  const ratio = safeLimit > 0 ? safeSpent / safeLimit : 0;

  const state: BudgetState = safeSpent > safeLimit && safeLimit > 0 ? 'over' : ratio >= NEAR_LIMIT_RATIO ? 'near' : 'ok';

  return {
    state,
    percent: Math.round(ratio * 100),
    fill: Math.min(Math.max(ratio, 0), 1),
    remaining: safeLimit - safeSpent,
    label: LABELS[state],
  };
}
