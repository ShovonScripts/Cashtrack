import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinancialReminder, ReminderPaymentRecord } from '@/types/reminder';
import { mutateJsonArray, objectRows, readJsonArray, writeJsonArray } from '@/storage/json-collection';

const REMINDERS_KEY = '@cashtrack/financial-reminders';
const PAYMENTS_KEY = '@cashtrack/reminder-payments';

const reminderRows = objectRows<FinancialReminder>('financial reminders');
const paymentRows = objectRows<ReminderPaymentRecord>('reminder payments');

export async function getAllReminders(): Promise<FinancialReminder[]> {
  return readJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows);
}

export async function getReminderById(id: string): Promise<FinancialReminder | undefined> {
  const reminders = await getAllReminders();
  return reminders.find((r) => r.id === id);
}

export async function insertReminder(reminder: FinancialReminder): Promise<void> {
  await mutateJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows, (reminders) => [
    reminder,
    ...reminders.filter((r) => r.id !== reminder.id),
  ]);
}

export async function updateReminder(reminder: FinancialReminder): Promise<void> {
  await mutateJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows, (reminders) =>
    reminders.map((r) => (r.id === reminder.id ? reminder : r))
  );
}

export async function deleteReminderRepo(id: string): Promise<void> {
  const reminders = await readJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows);
  const payments = await readJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows);
  await writeJsonArray(AsyncStorage, REMINDERS_KEY, reminders.filter((r) => r.id !== id));
  await writeJsonArray(AsyncStorage, PAYMENTS_KEY, payments.filter((p) => p.reminderId !== id));
}

export async function markPaymentAndReminderRepo(payment: ReminderPaymentRecord, reminder: FinancialReminder): Promise<void> {
  const payments = await readJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows);
  const reminders = await readJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows);
  await writeJsonArray(AsyncStorage, PAYMENTS_KEY, [payment, ...payments.filter((p) => p.id !== payment.id)]);
  await writeJsonArray(AsyncStorage, REMINDERS_KEY, reminders.map((r) => (r.id === reminder.id ? reminder : r)));
}

export async function getAllPayments(): Promise<ReminderPaymentRecord[]> {
  return readJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows);
}

export async function insertPayment(payment: ReminderPaymentRecord): Promise<void> {
  await mutateJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows, (payments) => [
    payment,
    ...payments.filter((p) => p.id !== payment.id),
  ]);
}
