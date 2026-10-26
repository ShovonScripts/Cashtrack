import type { DebtPayment, DebtRecord, DebtStatus, DebtType } from '@/types/debt';
import type { Expense, RecurringFrequency } from '@/types/expense';
import type {
  AllocationType,
  GoalContribution,
  GoalFrequency,
  GoalStatus,
  MoneyGoal,
  PotType,
} from '@/types/goal';
import type { IncomeRecord } from '@/types/income';
import type { Note, NoteColor } from '@/types/note';
import type { UserPreferences } from '@/types/preferences';
import type {
  FinancialReminder,
  ReminderCategory,
  ReminderPaymentRecord,
  ReminderRepeatType,
  ReminderStatus,
} from '@/types/reminder';

export const BACKUP_FORMAT = 'cashtrack-backup';
export const BACKUP_VERSION = 1;

export type BackupAttachment = {
  mimeType: string;
  data: string;
};

export type BackupRecurringSkips = {
  expense: Record<string, string[]>;
  income: Record<string, string[]>;
};

export type BackupData = {
  expenses: Expense[];
  preferences: UserPreferences;
  notes: Note[];
  debts: DebtRecord[];
  income: IncomeRecord[];
  goals: MoneyGoal[];
  contributions: GoalContribution[];
  reminders: FinancialReminder[];
  payments: ReminderPaymentRecord[];
  recurringSkips: BackupRecurringSkips;
  attachments: Record<string, BackupAttachment>;
};

export type BackupFile = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  appVersion?: string;
  data: BackupData;
};

export class BackupParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupParseError';
  }
}

const RECURRING_FREQUENCIES: readonly RecurringFrequency[] = ['weekly', 'monthly', 'yearly'];
const NOTE_COLORS: readonly NoteColor[] = ['default', 'red', 'blue', 'green', 'yellow', 'purple'];
const DEBT_TYPES: readonly DebtType[] = ['lent', 'borrowed'];
const DEBT_STATUSES: readonly DebtStatus[] = ['active', 'settled'];
const GOAL_FREQUENCIES: readonly GoalFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'half-yearly',
  'yearly',
];
const GOAL_STATUSES: readonly GoalStatus[] = ['active', 'completed'];
const POT_TYPES: readonly PotType[] = ['general', 'emergency', 'children', 'piggy_bank', 'dream'];
const ALLOCATION_TYPES: readonly AllocationType[] = ['manual', 'percentage', 'flexible'];
const REMINDER_CATEGORIES: readonly ReminderCategory[] = [
  'Bills',
  'EMI',
  'Loan',
  'Rent',
  'Credit Card',
  'Insurance',
  'Subscription',
  'Education',
  'Tax',
  'Utilities',
  'Other',
];
const REPEAT_TYPES: readonly ReminderRepeatType[] = ['one-time', 'weekly', 'monthly', 'yearly'];
const REMINDER_STATUSES: readonly ReminderStatus[] = [
  'upcoming',
  'due_today',
  'overdue',
  'paid',
  'skipped',
];

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new BackupParseError(message);
}

function asRecord(value: unknown, label: string): RawRecord {
  if (!isRecord(value)) fail(`${label} is not an object.`);
  return value;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} is missing or not a list.`);
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string') fail(`${label} must be text.`);
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(`${label} must be a number.`);
  return value;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') fail(`${label} must be true or false.`);
  return value;
}

function asNonEmptyString(value: unknown, label: string): string {
  const text = asString(value, label);
  if (text.trim() === '') fail(`${label} cannot be empty.`);
  return text;
}

function asPositiveNumber(value: unknown, label: string): number {
  const amount = asNumber(value, label);
  if (amount <= 0) fail(`${label} must be greater than zero.`);
  return amount;
}

function asNonNegativeNumber(value: unknown, label: string): number {
  const amount = asNumber(value, label);
  if (amount < 0) fail(`${label} cannot be negative.`);
  return amount;
}

function asDateString(value: unknown, label: string): string {
  const date = asString(value, label);
  if (Number.isNaN(new Date(date).getTime())) fail(`${label} is not a valid date.`);
  return date;
}

function optionalDateStringOrNull(value: unknown, label: string): string | null | undefined {
  if (value === undefined || value === null) return value;
  return asDateString(value, label);
}

function assertUniqueIds(rows: readonly { id: string }[], label: string): void {
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.id)) fail(`${label} contains the duplicate id "${row.id}".`);
    seen.add(row.id);
  }
}

function asOneOf<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    fail(`${label} has an unsupported value.`);
  }
  return value as T;
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) return undefined;
  return asString(value, label);
}

function optionalStringOrNull(value: unknown, label: string): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return asString(value, label);
}

function optionalNumberOrNull(value: unknown, label: string): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return asNumber(value, label);
}

function optionalBoolean(value: unknown, label: string): boolean | undefined {
  if (value === undefined) return undefined;
  return asBoolean(value, label);
}

function parseExpense(raw: unknown, index: number): Expense {
  const label = `Expense ${index + 1}`;
  const row = asRecord(raw, label);
  const expense: Expense = {
    id: asNonEmptyString(row.id, `${label} id`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    category: asNonEmptyString(row.category, `${label} category`),
    date: asDateString(row.date, `${label} date`),
    note: row.note === undefined ? '' : asString(row.note, `${label} note`),
  };
  const isRecurring = optionalBoolean(row.isRecurring, `${label} recurring flag`);
  if (isRecurring !== undefined) expense.isRecurring = isRecurring;
  if (row.recurringFrequency !== undefined) {
    expense.recurringFrequency = asOneOf(
      row.recurringFrequency,
      RECURRING_FREQUENCIES,
      `${label} recurring frequency`,
    );
  }
  const recurringEndDate = optionalDateStringOrNull(row.recurringEndDate, `${label} recurring end date`);
  if (recurringEndDate !== undefined) expense.recurringEndDate = recurringEndDate;
  const recurringParentId = optionalString(row.recurringParentId, `${label} recurring parent id`);
  if (recurringParentId !== undefined) expense.recurringParentId = recurringParentId;
  const receiptUri = optionalString(row.receiptUri, `${label} receipt`);
  if (receiptUri !== undefined) expense.receiptUri = receiptUri;
  return expense;
}

function parseNote(raw: unknown, index: number): Note {
  const label = `Note ${index + 1}`;
  const row = asRecord(raw, label);
  return {
    id: asNonEmptyString(row.id, `${label} id`),
    title: asString(row.title, `${label} title`),
    content: asString(row.content, `${label} content`),
    color: asOneOf(row.color, NOTE_COLORS, `${label} color`),
    updatedAt: asDateString(row.updatedAt, `${label} updated date`),
  };
}

function parseDebtPayment(raw: unknown, debtLabel: string, index: number): DebtPayment {
  const label = `${debtLabel} payment ${index + 1}`;
  const row = asRecord(raw, label);
  return {
    id: asNonEmptyString(row.id, `${label} id`),
    debtId: asNonEmptyString(row.debtId, `${label} debt id`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    date: asDateString(row.date, `${label} date`),
    note: row.note === undefined ? '' : asString(row.note, `${label} note`),
  };
}

function parseDebt(raw: unknown, index: number): DebtRecord {
  const label = `Debt ${index + 1}`;
  const row = asRecord(raw, label);
  const debt: DebtRecord = {
    id: asNonEmptyString(row.id, `${label} id`),
    personName: asNonEmptyString(row.personName, `${label} person name`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    type: asOneOf(row.type, DEBT_TYPES, `${label} type`),
    date: asDateString(row.date, `${label} date`),
    status: asOneOf(row.status, DEBT_STATUSES, `${label} status`),
    note: row.note === undefined ? '' : asString(row.note, `${label} note`),
  };
  const dueDate = optionalDateStringOrNull(row.dueDate, `${label} due date`);
  if (dueDate !== undefined) debt.dueDate = dueDate;
  const settledDate = optionalDateStringOrNull(row.settledDate, `${label} settled date`);
  if (settledDate !== undefined) debt.settledDate = settledDate;
  if (row.payments !== undefined) {
    const payments = asArray(row.payments, `${label} payments`).map((payment, paymentIndex) =>
      parseDebtPayment(payment, label, paymentIndex),
    );
    assertUniqueIds(payments, `${label} payments`);
    debt.payments = payments;
  }
  return debt;
}

function parseIncome(raw: unknown, index: number): IncomeRecord {
  const label = `Income ${index + 1}`;
  const row = asRecord(raw, label);
  const income: IncomeRecord = {
    id: asNonEmptyString(row.id, `${label} id`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    date: asDateString(row.date, `${label} date`),
    note: row.note === undefined ? '' : asString(row.note, `${label} note`),
  };
  const isRecurring = optionalBoolean(row.isRecurring, `${label} recurring flag`);
  if (isRecurring !== undefined) income.isRecurring = isRecurring;
  if (row.recurringFrequency !== undefined) {
    income.recurringFrequency = asOneOf(
      row.recurringFrequency,
      RECURRING_FREQUENCIES,
      `${label} recurring frequency`,
    );
  }
  const recurringEndDate = optionalDateStringOrNull(row.recurringEndDate, `${label} recurring end date`);
  if (recurringEndDate !== undefined) income.recurringEndDate = recurringEndDate;
  const recurringParentId = optionalString(row.recurringParentId, `${label} recurring parent id`);
  if (recurringParentId !== undefined) income.recurringParentId = recurringParentId;
  return income;
}

function parseGoal(raw: unknown, index: number): MoneyGoal {
  const label = `Goal ${index + 1}`;
  const row = asRecord(raw, label);
  const goal: MoneyGoal = {
    id: asNonEmptyString(row.id, `${label} id`),
    title: asNonEmptyString(row.title, `${label} title`),
    targetAmount: asNonNegativeNumber(row.targetAmount, `${label} target amount`),
    startDate: asDateString(row.startDate, `${label} start date`),
    frequency: asOneOf(row.frequency, GOAL_FREQUENCIES, `${label} frequency`),
    status: asOneOf(row.status, GOAL_STATUSES, `${label} status`),
    potType: asOneOf(row.potType ?? 'general', POT_TYPES, `${label} pot type`),
    allocationType: asOneOf(
      row.allocationType ?? 'manual',
      ALLOCATION_TYPES,
      `${label} allocation type`,
    ),
    allocationPercent: optionalNumberOrNull(row.allocationPercent, `${label} allocation percent`) ?? null,
    icon: row.icon === undefined ? 'piggy-bank' : asString(row.icon, `${label} icon`),
  };
  const allocationPercent = goal.allocationPercent;
  if (allocationPercent !== null && (allocationPercent < 0 || allocationPercent > 100)) {
    fail(`${label} allocation percent must be between 0 and 100.`);
  }
  const deadlineDate = optionalDateStringOrNull(row.deadlineDate, `${label} deadline`);
  if (deadlineDate !== undefined) goal.deadlineDate = deadlineDate;
  return goal;
}

function parseContribution(raw: unknown, index: number): GoalContribution {
  const label = `Contribution ${index + 1}`;
  const row = asRecord(raw, label);
  const contribution: GoalContribution = {
    id: asNonEmptyString(row.id, `${label} id`),
    goalId: asNonEmptyString(row.goalId, `${label} goal id`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    date: asDateString(row.date, `${label} date`),
    note: row.note === undefined ? '' : asString(row.note, `${label} note`),
  };
  const sourceIncomeId = optionalStringOrNull(row.sourceIncomeId, `${label} source income`);
  if (sourceIncomeId !== undefined) contribution.sourceIncomeId = sourceIncomeId;
  return contribution;
}

function parseReminder(raw: unknown, index: number): FinancialReminder {
  const label = `Reminder ${index + 1}`;
  const row = asRecord(raw, label);
  const reminder: FinancialReminder = {
    id: asNonEmptyString(row.id, `${label} id`),
    title: asNonEmptyString(row.title, `${label} title`),
    amount: optionalNumberOrNull(row.amount, `${label} amount`) ?? null,
    isVariableAmount: asBoolean(row.isVariableAmount, `${label} variable amount`),
    category: asOneOf(row.category, REMINDER_CATEGORIES, `${label} category`),
    dueDate: asDateString(row.dueDate, `${label} due date`),
    repeatType: asOneOf(row.repeatType, REPEAT_TYPES, `${label} repeat type`),
    status: asOneOf(row.status, REMINDER_STATUSES, `${label} status`),
    notes: row.notes === undefined ? '' : asString(row.notes, `${label} notes`),
    paidAmountCurrentCycle: 0,
    isAlarm: asBoolean(row.isAlarm, `${label} alarm flag`),
    createdAt: asDateString(row.createdAt, `${label} created date`),
    updatedAt: asDateString(row.updatedAt, `${label} updated date`),
  };
  if (reminder.amount !== null && reminder.amount <= 0) {
    fail(`${label} amount must be greater than zero.`);
  }
  const originalDueDate = optionalDateStringOrNull(row.originalDueDate, `${label} original due date`);
  if (originalDueDate !== undefined) reminder.originalDueDate = originalDueDate;
  const totalAmount = optionalNumberOrNull(row.totalAmount, `${label} total amount`);
  if (totalAmount !== undefined) {
    if (totalAmount !== null && totalAmount < 0) fail(`${label} total amount cannot be negative.`);
    reminder.totalAmount = totalAmount;
  }
  const installmentAmount = optionalNumberOrNull(row.installmentAmount, `${label} installment amount`);
  if (installmentAmount !== undefined) {
    if (installmentAmount !== null && installmentAmount <= 0) {
      fail(`${label} installment amount must be greater than zero.`);
    }
    reminder.installmentAmount = installmentAmount;
  }
  const totalInstallments = optionalNumberOrNull(row.totalInstallments, `${label} total installments`);
  if (totalInstallments !== undefined) {
    if (totalInstallments !== null && (!Number.isInteger(totalInstallments) || totalInstallments < 0)) {
      fail(`${label} total installments must be a whole number of at least 0.`);
    }
    reminder.totalInstallments = totalInstallments;
  }
  const paidInstallments = optionalNumberOrNull(row.paidInstallments, `${label} paid installments`);
  if (paidInstallments !== undefined) {
    if (paidInstallments !== null && (!Number.isInteger(paidInstallments) || paidInstallments < 0)) {
      fail(`${label} paid installments must be a whole number of at least 0.`);
    }
    reminder.paidInstallments = paidInstallments ?? 0;
  }
  const paidAmountCurrentCycle = optionalNumberOrNull(row.paidAmountCurrentCycle, `${label} paid amount this cycle`);
  if (paidAmountCurrentCycle !== undefined) {
    if (paidAmountCurrentCycle !== null && paidAmountCurrentCycle < 0) {
      fail(`${label} paid amount this cycle cannot be negative.`);
    }
    reminder.paidAmountCurrentCycle = paidAmountCurrentCycle ?? 0;
  }
  const alarmTime = optionalStringOrNull(row.alarmTime, `${label} alarm time`);
  if (alarmTime !== undefined) reminder.alarmTime = alarmTime;
  return reminder;
}

function parsePayment(raw: unknown, index: number): ReminderPaymentRecord {
  const label = `Reminder payment ${index + 1}`;
  const row = asRecord(raw, label);
  const payment: ReminderPaymentRecord = {
    id: asNonEmptyString(row.id, `${label} id`),
    reminderId: asNonEmptyString(row.reminderId, `${label} reminder id`),
    amount: asPositiveNumber(row.amount, `${label} amount`),
    paidDate: asDateString(row.paidDate, `${label} paid date`),
    createdAt: asDateString(row.createdAt, `${label} created date`),
  };
  const expenseId = optionalStringOrNull(row.expenseId, `${label} expense id`);
  if (expenseId !== undefined) payment.expenseId = expenseId;
  const notes = optionalString(row.notes, `${label} notes`);
  if (notes !== undefined) payment.notes = notes;
  return payment;
}

function parsePreferences(raw: unknown): UserPreferences {
  const row = asRecord(raw, 'Preferences');
  if (!isRecord(row.profile)) fail('Preferences profile is missing or invalid.');
  return row as unknown as UserPreferences;
}

function isUnsafeKey(key: string): boolean {
  return key === '__proto__' || key === 'constructor' || key === 'prototype';
}

function parseSkipGroup(raw: unknown, label: string): Record<string, string[]> {
  if (raw === undefined) return {};
  const row = asRecord(raw, label);
  const result: Record<string, string[]> = {};
  for (const [key, periods] of Object.entries(row)) {
    if (isUnsafeKey(key)) continue;
    result[key] = asArray(periods, `${label} periods`).map((period, index) =>
      asString(period, `${label} period ${index + 1}`),
    );
  }
  return result;
}

function parseRecurringSkips(raw: unknown): BackupRecurringSkips {
  if (raw === undefined) return { expense: {}, income: {} };
  const row = asRecord(raw, 'Recurring skips');
  return {
    expense: parseSkipGroup(row.expense, 'Expense recurring skips'),
    income: parseSkipGroup(row.income, 'Income recurring skips'),
  };
}

function parseAttachments(raw: unknown): Record<string, BackupAttachment> {
  if (raw === undefined) return {};
  const row = asRecord(raw, 'Attachments');
  const result: Record<string, BackupAttachment> = {};
  for (const [uri, value] of Object.entries(row)) {
    if (isUnsafeKey(uri)) continue;
    const attachment = asRecord(value, `Attachment ${uri}`);
    result[uri] = {
      mimeType: attachment.mimeType === undefined
        ? 'application/octet-stream'
        : asString(attachment.mimeType, `Attachment ${uri} type`),
      data: asString(attachment.data, `Attachment ${uri} data`),
    };
  }
  return result;
}

export function serializeBackup(file: BackupFile): string {
  return JSON.stringify(file, null, 2);
}

/**
 * Validates a backup file before any existing data is touched. Throws
 * `BackupParseError` with a user-safe message for anything unexpected, so a
 * malformed file can never partially overwrite the user's data.
 */
export function parseBackup(raw: string): BackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    fail('This file is not valid JSON.');
  }

  const root = asRecord(parsed, 'Backup file');
  if (root.format !== BACKUP_FORMAT) {
    fail('This is not a CashTrack backup file.');
  }

  const version = asNumber(root.version, 'Backup version');
  if (!Number.isInteger(version) || version < 1) {
    fail('This backup reports an invalid version.');
  }
  if (version > BACKUP_VERSION) {
    fail('This backup was created by a newer version of CashTrack. Update the app first.');
  }

  const data = asRecord(root.data, 'Backup data');
  const expenses = asArray(data.expenses, 'Expenses').map(parseExpense);
  const notes = asArray(data.notes, 'Notes').map(parseNote);
  const debts = asArray(data.debts, 'Debts').map(parseDebt);
  const income = asArray(data.income, 'Income').map(parseIncome);
  const goals = asArray(data.goals, 'Goals').map(parseGoal);
  const contributions = asArray(data.contributions, 'Goal contributions').map(parseContribution);
  const reminders = asArray(data.reminders, 'Reminders').map(parseReminder);
  const payments = asArray(data.payments, 'Reminder payments').map(parsePayment);

  assertUniqueIds(expenses, 'Expenses');
  assertUniqueIds(notes, 'Notes');
  assertUniqueIds(debts, 'Debts');
  assertUniqueIds(income, 'Income');
  assertUniqueIds(goals, 'Goals');
  assertUniqueIds(contributions, 'Goal contributions');
  assertUniqueIds(reminders, 'Reminders');
  assertUniqueIds(payments, 'Reminder payments');

  const exportedAt = typeof root.exportedAt === 'string' && !Number.isNaN(new Date(root.exportedAt).getTime())
    ? root.exportedAt
    : new Date().toISOString();

  return {
    format: BACKUP_FORMAT,
    version,
    exportedAt,
    appVersion: typeof root.appVersion === 'string' ? root.appVersion : undefined,
    data: {
      expenses,
      preferences: parsePreferences(data.preferences),
      notes,
      debts,
      income,
      goals,
      contributions,
      reminders,
      payments,
      recurringSkips: parseRecurringSkips(data.recurringSkips),
      attachments: parseAttachments(data.attachments),
    },
  };
}

function collectAttachmentUris(data: BackupData): string[] {
  const uris = new Set<string>();
  // Remote preset banners and picker cache URIs are not portable files, so only
  // local `file://` images are embedded in a backup.
  const add = (uri: string | undefined) => {
    if (uri && uri.startsWith('file://')) uris.add(uri);
  };
  for (const expense of data.expenses) {
    add(expense.receiptUri);
  }
  add(data.preferences.profile.coverPhotoUri);
  add(data.preferences.profile.profilePhotoUri);
  return [...uris];
}

/** Lists every local image URI that should be embedded in the backup file. */
export function listAttachmentUris(data: BackupData): string[] {
  return collectAttachmentUris(data);
}

/** Rewrites image URIs after their files have been recreated during a restore. */
export function remapAttachmentUris(data: BackupData, mapping: Record<string, string>): BackupData {
  const replace = (uri: unknown): string | undefined =>
    typeof uri === 'string' && uri.length > 0 ? (mapping[uri] ?? uri) : undefined;

  const profile = data.preferences.profile;
  const preferences: UserPreferences = {
    ...data.preferences,
    profile: {
      ...profile,
      coverPhotoUri: replace(profile.coverPhotoUri),
      profilePhotoUri: replace(profile.profilePhotoUri),
    },
  };

  return {
    ...data,
    preferences,
    expenses: data.expenses.map((expense) => ({
      ...expense,
      receiptUri: replace(expense.receiptUri),
    })),
  };
}
