import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FinancialReminder, ReminderPaymentRecord } from '@/types/reminder';
import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';

const REMINDERS_KEY = '@cashtrack/financial-reminders';
const PAYMENTS_KEY = '@cashtrack/reminder-payments';

const reminderRows = objectRows<FinancialReminder>('financial reminders');
const paymentRows = objectRows<ReminderPaymentRecord>('reminder payments');

export async function getAllReminders(): Promise<FinancialReminder[]> {
  const reminders = await readJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows);
  return reminders.sort((first, second) => first.dueDate.localeCompare(second.dueDate));
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
  let removedReminder: FinancialReminder | undefined;

  await mutateJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows, (reminders) => {
    removedReminder = reminders.find((r) => r.id === id);
    return reminders.filter((r) => r.id !== id);
  });

  try {
    await mutateJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows, (payments) =>
      payments.filter((p) => p.reminderId !== id)
    );
  } catch (error) {
    // Restore the reminder if its payment rows could not be removed, otherwise
    // the remaining payments would be orphaned and invisible in the UI.
    const reminderToRestore = removedReminder;
    if (reminderToRestore) {
      await mutateJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows, (reminders) =>
        reminders.some((r) => r.id === reminderToRestore.id) ? reminders : [reminderToRestore, ...reminders]
      ).catch((rollbackError) => {
        console.error('[cashtrack] Failed to roll back reminder deletion', rollbackError);
      });
    }
    throw error;
  }
}

export async function markPaymentAndReminderRepo(payment: ReminderPaymentRecord, reminder: FinancialReminder): Promise<void> {
  await mutateJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows, (payments) => [
    payment,
    ...payments.filter((p) => p.id !== payment.id),
  ]);

  try {
    await mutateJsonArray(AsyncStorage, REMINDERS_KEY, 'financial reminders', reminderRows, (reminders) =>
      reminders.map((r) => (r.id === reminder.id ? reminder : r))
    );
  } catch (error) {
    await mutateJsonArray(AsyncStorage, PAYMENTS_KEY, 'reminder payments', paymentRows, (payments) =>
      payments.filter((p) => p.id !== payment.id)
    ).catch((rollbackError) => {
      console.error('[cashtrack] Failed to roll back a reminder payment', rollbackError);
    });
    throw error;
  }
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
