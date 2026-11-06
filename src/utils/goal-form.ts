import type { AllocationType, GoalFrequency, PotType } from '@/types/goal';

/** Choices and validation shared by the Create and Edit pot screens. */

export const GOAL_FREQUENCIES: readonly { label: string; value: GoalFrequency }[] = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
  { label: 'Quarterly', value: 'quarterly' },
  { label: 'Half-yearly', value: 'half-yearly' },
  { label: 'Yearly', value: 'yearly' },
];

export type PotChoice = 'piggy_bank' | 'children' | 'emergency' | 'dream';

export const POT_TYPES: readonly {
  label: string;
  value: PotChoice;
  detail: string;
  suggestedPercent: string;
  /** Stored on the goal and shown on its card. */
  icon: string;
}[] = [
  {
    label: 'General',
    value: 'piggy_bank',
    detail: 'For short-term buys, gadgets or a general cash reserve. Add money any time.',
    suggestedPercent: '10',
    icon: 'piggy-bank',
  },
  {
    label: 'Junior',
    value: 'children',
    detail: 'A long-term pot for your children: school, activities or a future gift.',
    suggestedPercent: '5',
    icon: 'teddy-bear',
  },
  {
    label: 'Emergency',
    value: 'emergency',
    detail: 'A safety net for the unexpected. Experts suggest 3 to 6 months of living costs.',
    suggestedPercent: '15',
    icon: 'shield-check',
  },
  {
    label: 'Milestone',
    value: 'dream',
    detail: 'For a big target with a deadline, such as a trip or a vehicle.',
    suggestedPercent: '10',
    icon: 'star-shooting',
  },
];

export const ALLOCATION_RULES: readonly { value: AllocationType; label: string; detail: string }[] = [
  { value: 'percentage', label: 'Auto-save', detail: 'A share of every income you record goes into this pot.' },
  { value: 'flexible', label: 'Flexible', detail: 'No rules, no deadline. Add money whenever you like.' },
  { value: 'manual', label: 'Manual', detail: 'You add money yourself, paced towards a deadline.' },
];

export const PERCENT_PRESETS = ['5', '10', '15', '20'] as const;

/** Older pots saved as 'general' show as the General choice ('piggy_bank'). */
export function toPotChoice(potType: PotType | null | undefined): PotChoice {
  return potType === 'children' || potType === 'emergency' || potType === 'dream' ? potType : 'piggy_bank';
}

export function potMeta(potType: PotChoice) {
  return POT_TYPES.find((p) => p.value === potType) ?? POT_TYPES[0];
}

/** True when the title is empty or still one of the automatic "<Type> Savings" names. */
export function isDefaultPotTitle(title: string): boolean {
  const trimmed = title.trim();
  return !trimmed || POT_TYPES.some((p) => trimmed === p.label || trimmed === `${p.label} Savings`);
}

export const roundPercent = (value: number) => Math.round(value * 100) / 100;

export type GoalFormValues = {
  title: string;
  targetAmount: string;
  allocationType: AllocationType;
  allocationPercent: string;
};

export type GoalFormErrors = Partial<Record<'title' | 'targetAmount' | 'allocationPercent', string>>;

export type ParsedGoalForm = {
  title: string;
  targetAmount: number;
  allocationPercent: number | null;
};

/**
 * Checks the form. `committedPercent` is what the user's other active pots
 * already auto-save, so the total never passes 100% of an income.
 */
export function validateGoalForm(
  values: GoalFormValues,
  committedPercent: number,
): { errors: GoalFormErrors; parsed: ParsedGoalForm | null } {
  const errors: GoalFormErrors = {};
  const title = values.title.trim();
  const targetText = values.targetAmount.trim();
  const targetAmount = targetText ? Number(targetText) : 0;

  if (!title) errors.title = 'Give the pot a name.';
  if (targetText && (!Number.isFinite(targetAmount) || targetAmount <= 0)) {
    errors.targetAmount = 'Enter an amount above zero, or leave it blank.';
  }

  let allocationPercent: number | null = null;
  if (values.allocationType === 'percentage') {
    allocationPercent = Number(values.allocationPercent);
    if (!values.allocationPercent.trim() || !Number.isFinite(allocationPercent) || allocationPercent <= 0 || allocationPercent > 100) {
      errors.allocationPercent = 'Enter a percentage from 1 to 100.';
    } else if (committedPercent + allocationPercent > 100) {
      errors.allocationPercent = `That makes ${roundPercent(committedPercent + allocationPercent)}% of every income. Lower this pot or another one to stay within 100%.`;
    }
  }

  if (Object.keys(errors).length > 0) return { errors, parsed: null };
  return { errors, parsed: { title: title.slice(0, 60), targetAmount, allocationPercent } };
}
