import { initDatabase } from '@/storage/db';
import type { FinancialReminder, ReminderPaymentRecord, ReminderCategory, ReminderRepeatType, ReminderStatus } from '@/types/reminder';

interface ReminderRow {
  id: string;
  title: string;
  amount: number | null;
  is_variable_amount: number;
  category: string;
  due_date: string;
  original_due_date: string | null;
  repeat_type: string;
  status: string;
  notes: string;
  total_amount: number | null;
  installment_amount: number | null;
  total_installments: number | null;
  paid_installments: number | null;
  created_at: string;
  updated_at: string;
}

interface PaymentRow {
  id: string;
  reminder_id: string;
  amount: number;
  paid_date: string;
  expense_id: string | null;
  notes: string;
  created_at: string;
}

function mapReminderRow(row: ReminderRow): FinancialReminder {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    isVariableAmount: Boolean(row.is_variable_amount),
    category: row.category as ReminderCategory,
    dueDate: row.due_date,
    originalDueDate: row.original_due_date,
    repeatType: row.repeat_type as ReminderRepeatType,
    status: row.status as ReminderStatus,
    notes: row.notes,
    totalAmount: row.total_amount,
    installmentAmount: row.installment_amount,
    totalInstallments: row.total_installments,
    paidInstallments: row.paid_installments ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPaymentRow(row: PaymentRow): ReminderPaymentRecord {
  return {
    id: row.id,
    reminderId: row.reminder_id,
    amount: row.amount,
    paidDate: row.paid_date,
    expenseId: row.expense_id,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function getAllReminders(): Promise<FinancialReminder[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<ReminderRow>('SELECT * FROM financial_reminders ORDER BY due_date ASC');
  return rows.map(mapReminderRow);
}

export async function getReminderById(id: string): Promise<FinancialReminder | undefined> {
  const db = await initDatabase();
  const row = await db.getFirstAsync<ReminderRow>('SELECT * FROM financial_reminders WHERE id = ?', id);
  return row ? mapReminderRow(row) : undefined;
}

export async function insertReminder(reminder: FinancialReminder): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT INTO financial_reminders (id, title, amount, is_variable_amount, category, due_date, original_due_date, repeat_type, status, notes, total_amount, installment_amount, total_installments, paid_installments, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    reminder.id,
    reminder.title,
    reminder.amount,
    reminder.isVariableAmount ? 1 : 0,
    reminder.category,
    reminder.dueDate,
    reminder.originalDueDate ?? reminder.dueDate,
    reminder.repeatType,
    reminder.status,
    reminder.notes,
    reminder.totalAmount ?? null,
    reminder.installmentAmount ?? null,
    reminder.totalInstallments ?? null,
    reminder.paidInstallments ?? 0,
    reminder.createdAt,
    reminder.updatedAt
  );
}

export async function updateReminder(reminder: FinancialReminder): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `UPDATE financial_reminders SET title = ?, amount = ?, is_variable_amount = ?, category = ?, due_date = ?, original_due_date = ?, repeat_type = ?, status = ?, notes = ?, total_amount = ?, installment_amount = ?, total_installments = ?, paid_installments = ?, updated_at = ? WHERE id = ?`,
    reminder.title,
    reminder.amount,
    reminder.isVariableAmount ? 1 : 0,
    reminder.category,
    reminder.dueDate,
    reminder.originalDueDate ?? reminder.dueDate,
    reminder.repeatType,
    reminder.status,
    reminder.notes,
    reminder.totalAmount ?? null,
    reminder.installmentAmount ?? null,
    reminder.totalInstallments ?? null,
    reminder.paidInstallments ?? 0,
    reminder.updatedAt,
    reminder.id
  );
}

export async function deleteReminderRepo(id: string): Promise<void> {
  const db = await initDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM reminder_payments WHERE reminder_id = ?', id);
    await db.runAsync('DELETE FROM financial_reminders WHERE id = ?', id);
  });
}

export async function markPaymentAndReminderRepo(payment: ReminderPaymentRecord, reminder: FinancialReminder): Promise<void> {
  const db = await initDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO reminder_payments (id, reminder_id, amount, paid_date, expense_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      payment.id,
      payment.reminderId,
      payment.amount,
      payment.paidDate,
      payment.expenseId ?? null,
      payment.notes ?? '',
      payment.createdAt
    );
    await db.runAsync(
      `UPDATE financial_reminders SET title = ?, amount = ?, is_variable_amount = ?, category = ?, due_date = ?, original_due_date = ?, repeat_type = ?, status = ?, notes = ?, total_amount = ?, installment_amount = ?, total_installments = ?, paid_installments = ?, updated_at = ? WHERE id = ?`,
      reminder.title,
      reminder.amount,
      reminder.isVariableAmount ? 1 : 0,
      reminder.category,
      reminder.dueDate,
      reminder.originalDueDate ?? reminder.dueDate,
      reminder.repeatType,
      reminder.status,
      reminder.notes,
      reminder.totalAmount ?? null,
      reminder.installmentAmount ?? null,
      reminder.totalInstallments ?? null,
      reminder.paidInstallments ?? 0,
      reminder.updatedAt,
      reminder.id
    );
  });
}

export async function getAllPayments(): Promise<ReminderPaymentRecord[]> {
  const db = await initDatabase();
  const rows = await db.getAllAsync<PaymentRow>('SELECT * FROM reminder_payments ORDER BY paid_date DESC');
  return rows.map(mapPaymentRow);
}

export async function insertPayment(payment: ReminderPaymentRecord): Promise<void> {
  const db = await initDatabase();
  await db.runAsync(
    `INSERT INTO reminder_payments (id, reminder_id, amount, paid_date, expense_id, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    payment.id,
    payment.reminderId,
    payment.amount,
    payment.paidDate,
    payment.expenseId ?? null,
    payment.notes ?? '',
    payment.createdAt
  );
}
