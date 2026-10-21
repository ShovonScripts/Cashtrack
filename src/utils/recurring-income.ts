import type { IncomeRecord } from '../types/income.ts';
import { getRecurringPeriodKey, nextRecurringDate } from './recurring.ts';

export function processRecurringIncome(
  incomeList: IncomeRecord[],
  skippedPeriods: Record<string, ReadonlySet<string>> = {}
): IncomeRecord[] {
  const now = new Date();
  const existing = [...incomeList];
  const templates = existing.filter((i) => i.isRecurring && !i.recurringParentId);

  let added = false;
  const newInstances: IncomeRecord[] = [];

  for (const template of templates) {
    if (!template.recurringFrequency) continue;
    const startDate = new Date(template.date);
    if (Number.isNaN(startDate.getTime())) continue;

    const endDate = template.recurringEndDate ? new Date(template.recurringEndDate) : now;
    const freq = template.recurringFrequency;
    const skipped = skippedPeriods[template.id];

    let current = new Date(startDate);
    current = nextRecurringDate(startDate, current, freq);

    while (current <= now && current <= endDate) {
      const dateIso = current.toISOString();
      const periodKey = getRecurringPeriodKey(current, freq);

      const exists = existing.some((i) => {
        if (i.recurringParentId !== template.id) return false;
        const iDate = new Date(i.date);
        return getRecurringPeriodKey(iDate, freq) === periodKey;
      });

      if (!exists && !skipped?.has(periodKey)) {
        const newId = `rec-inc-${template.id}-${periodKey}`;
        if (!newInstances.some((a) => a.id === newId)) {
          newInstances.push({
            id: newId,
            amount: template.amount,
            date: dateIso,
            note: template.note ? `${template.note} (Recurring)` : 'Recurring income',
            recurringParentId: template.id,
          });
          added = true;
        }
      }

      current = nextRecurringDate(startDate, current, freq);
    }
  }

  if (!added) return existing;
  return [...newInstances, ...existing];
}
