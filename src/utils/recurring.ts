import type { Expense, RecurringFrequency } from '@/types/expense';

/**
 * Checks recurring expense templates and automatically generates due instances
 * up to the current date without duplicating existing ones.
 */
export function processRecurringExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const existingExpenses = [...expenses];
  const templates = existingExpenses.filter((e) => e.isRecurring && !e.recurringParentId);

  let newInstancesAdded = false;
  const addedInstances: Expense[] = [];

  for (const template of templates) {
    if (!template.recurringFrequency) continue;
    const startDate = new Date(template.date);
    if (Number.isNaN(startDate.getTime())) continue;

    const endDate = template.recurringEndDate ? new Date(template.recurringEndDate) : now;
    const freq = template.recurringFrequency;

    let current = new Date(startDate);
    current = nextRecurringDate(startDate, current, freq);

    while (current <= now && current <= endDate) {
      const dateIso = current.toISOString();
      const periodKey = getPeriodKey(current, freq);

      const exists = existingExpenses.some((e) => {
        if (e.recurringParentId !== template.id) return false;
        const eDate = new Date(e.date);
        return getPeriodKey(eDate, freq) === periodKey;
      });

      if (!exists) {
        const newId = `rec-${template.id}-${periodKey}`;
        if (!addedInstances.some((a) => a.id === newId)) {
          addedInstances.push({
            id: newId,
            amount: template.amount,
            category: template.category,
            date: dateIso,
            note: template.note ? `${template.note} (Recurring)` : 'Recurring expense',
            recurringParentId: template.id,
          });
          newInstancesAdded = true;
        }
      }

      current = nextRecurringDate(startDate, current, freq);
    }
  }

  if (!newInstancesAdded) {
    return existingExpenses;
  }

  return [...addedInstances, ...existingExpenses];
}

/** Number of days in the given zero-indexed month, e.g. daysInMonth(2026, 1) === 28. */
function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Builds a date in the given year and zero-indexed month, on the requested day clamped
 * to that month's length. The day is clamped by hand because `setFullYear` with an
 * out-of-range day overflows into the following month (Jan 31 + 1 month = Mar 3) rather
 * than clamping the way Date's constructor does.
 */
function withClampedDay(
  anchor: Date,
  year: number,
  monthIndex: number,
  day: number,
): Date {
  const next = new Date(anchor);
  next.setFullYear(year, monthIndex, Math.min(day, daysInMonth(year, monthIndex)));
  return next;
}

/**
 * Returns the occurrence after `current` for a template anchored on `anchor`.
 *
 * Every step is derived from the anchor's own day-of-month rather than from the previous
 * occurrence, so a template anchored on the 31st does not slide forward each month:
 * Jan 31 gives Feb 28, then Mar 31 again. Clamping only the short month is the desired
 * behaviour for recurring bills; deriving from `current` would permanently pin the
 * template to the 3rd after February.
 */
export function nextRecurringDate(
  anchor: Date,
  current: Date,
  freq: RecurringFrequency,
): Date {
  if (freq === 'weekly') {
    const next = new Date(current);
    next.setDate(next.getDate() + 7);
    return next;
  }

  if (freq === 'monthly') {
    return withClampedDay(anchor, current.getFullYear(), current.getMonth() + 1, anchor.getDate());
  }

  return withClampedDay(anchor, current.getFullYear() + 1, current.getMonth(), anchor.getDate());
}

function getPeriodKey(date: Date, freq: 'weekly' | 'monthly' | 'yearly'): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  if (freq === 'weekly') {
    return `${y}-W${Math.ceil(Number(d) / 7)}-${m}`;
  }
  if (freq === 'monthly') {
    return `${y}-${m}`;
  }
  return `${y}`;
}
