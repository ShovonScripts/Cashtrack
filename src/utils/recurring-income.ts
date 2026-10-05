import type { IncomeRecord } from '../types/income.ts';
import { nextRecurringDate } from './recurring.ts';

export function processRecurringIncome(incomeList: IncomeRecord[]): IncomeRecord[] {
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

    let current = new Date(startDate);
    current = nextRecurringDate(startDate, current, freq);

    while (current <= now && current <= endDate) {
      const dateIso = current.toISOString();
      const periodKey = getPeriodKey(current, freq);

      const exists = existing.some((i) => {
        if (i.recurringParentId !== template.id) return false;
        const iDate = new Date(i.date);
        return getPeriodKey(iDate, freq) === periodKey;
      });

      if (!exists) {
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
