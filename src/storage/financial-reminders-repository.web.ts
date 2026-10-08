import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinancialReminder, ReminderPaymentRecord } from '@/types/reminder';

const REMINDERS_KEY = '@cashtrack/financial-reminders';
const PAYMENTS_KEY = '@cashtrack/reminder-payments';

export async function getAllReminders(): Promise<FinancialReminder[]> {
  try {
    const raw = await AsyncStorage.getItem(REMINDERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function getReminderById(id: string): Promise<FinancialReminder | undefined> {
  const reminders = await getAllReminders();
  return reminders.find((r) => r.id === id);
}

export async function insertReminder(reminder: FinancialReminder): Promise<void> {
  const reminders = await getAllReminders();
  const next = [reminder, ...reminders.filter((r) => r.id !== reminder.id)];
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
}

export async function updateReminder(reminder: FinancialReminder): Promise<void> {
  const reminders = await getAllReminders();
  const next = reminders.map((r) => (r.id === reminder.id ? reminder : r));
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(next));
}

export async function deleteReminderRepo(id: string): Promise<void> {
  const reminders = await getAllReminders();
  const nextReminders = reminders.filter((r) => r.id !== id);
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(nextReminders));

  const payments = await getAllPayments();
  const nextPayments = payments.filter((p) => p.reminderId !== id);
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(nextPayments));
}

export async function markPaymentAndReminderRepo(payment: ReminderPaymentRecord, reminder: FinancialReminder): Promise<void> {
  const payments = await getAllPayments();
  const nextPayments = [payment, ...payments.filter((p) => p.id !== payment.id)];
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(nextPayments));

  const reminders = await getAllReminders();
  const nextReminders = reminders.map((r) => (r.id === reminder.id ? reminder : r));
  await AsyncStorage.setItem(REMINDERS_KEY, JSON.stringify(nextReminders));
}

export async function getAllPayments(): Promise<ReminderPaymentRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(PAYMENTS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function insertPayment(payment: ReminderPaymentRecord): Promise<void> {
  const payments = await getAllPayments();
  const next = [payment, ...payments.filter((p) => p.id !== payment.id)];
  await AsyncStorage.setItem(PAYMENTS_KEY, JSON.stringify(next));
}
