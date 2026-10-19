import { Share } from 'react-native';

import type { DebtRecord } from '@/types/debt';
import { buildDebtShareMessage } from '@/utils/debt';
import { formatDate } from '@/utils/expense';

export function getDebtShareMessage(debt: DebtRecord, formatAmount: (amount: number) => string): string {
  return buildDebtShareMessage(debt, formatAmount, formatDate);
}

export async function shareDebtReminder(debt: DebtRecord, formatAmount: (amount: number) => string): Promise<void> {
  const message = getDebtShareMessage(debt, formatAmount);

  try {
    await Share.share({
      message,
      title: `Debt reminder for ${debt.personName}`,
    });
  } catch {
    // Ignore share cancellation/errors
  }
}
