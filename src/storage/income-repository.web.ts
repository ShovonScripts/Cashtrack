import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IncomeRecord, IncomeDraft } from '@/types/income';

const INCOME_KEY = '@cashtrack/income';

export async function insertIncome(income: IncomeRecord): Promise<void> {
  const list = await getAllIncome();
  const next = [income, ...list.filter((i) => i.id !== income.id)];
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(next));
}

export async function getAllIncome(): Promise<IncomeRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(INCOME_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getIncomeById(id: string): Promise<IncomeRecord | undefined> {
  const list = await getAllIncome();
  return list.find((i) => i.id === id);
}

export async function updateIncome(id: string, changes: IncomeDraft): Promise<void> {
  const list = await getAllIncome();
  const next = list.map((item) =>
    item.id === id
      ? {
          ...item,
          amount: changes.amount,
          note: changes.note ?? item.note,
          isRecurring: changes.isRecurring ?? item.isRecurring,
          recurringFrequency: changes.recurringFrequency ?? item.recurringFrequency,
          recurringEndDate: changes.recurringEndDate ?? item.recurringEndDate,
        }
      : item
  );
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(next));
}

export async function deleteIncome(id: string): Promise<void> {
  const list = await getAllIncome();
  const next = list.filter((item) => item.id !== id && item.recurringParentId !== id);
  await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(next));
}

export async function countIncome(): Promise<number> {
  const list = await getAllIncome();
  return list.length;
}
