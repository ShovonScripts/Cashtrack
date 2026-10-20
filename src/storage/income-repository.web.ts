import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IncomeRecord, IncomeDraft } from '@/types/income';
import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';
import { applyIncomeUpdate } from '@/utils/income';

const INCOME_KEY = '@cashtrack/income';

const incomeRows = objectRows<IncomeRecord>('income');

export async function insertIncome(income: IncomeRecord): Promise<void> {
  await mutateJsonArray(AsyncStorage, INCOME_KEY, 'income', incomeRows, (list) => [
    income,
    ...list.filter((i) => i.id !== income.id),
  ]);
}

export async function getAllIncome(): Promise<IncomeRecord[]> {
  return readJsonArray(AsyncStorage, INCOME_KEY, 'income', incomeRows);
}

export async function getIncomeById(id: string): Promise<IncomeRecord | undefined> {
  const list = await getAllIncome();
  return list.find((i) => i.id === id);
}

export async function updateIncome(id: string, changes: IncomeDraft): Promise<void> {
  await mutateJsonArray(AsyncStorage, INCOME_KEY, 'income', incomeRows, (list) =>
    list.map((item) => (item.id === id ? applyIncomeUpdate(item, changes) : item))
  );
}

export async function deleteIncome(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, INCOME_KEY, 'income', incomeRows, (list) =>
    list.filter((item) => item.id !== id && item.recurringParentId !== id)
  );
}

export async function countIncome(): Promise<number> {
  const list = await getAllIncome();
  return list.length;
}
