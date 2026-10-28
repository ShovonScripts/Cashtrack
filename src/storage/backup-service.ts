import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { APP_LOCK_STORAGE_KEY, saveAppLockFlag } from '@/storage/app-lock-storage';
import {
  captureRelationalSnapshot,
  replaceRelationalData,
  type RelationalSnapshot,
} from '@/storage/backup-restore-repository';
import { DEBT_STORAGE_KEY, loadDebts, saveDebts } from '@/storage/debt-storage';
import { loadExpenses, saveExpenses, STORAGE_KEY as EXPENSES_STORAGE_KEY } from '@/storage/expense-storage';
import { getAllPayments, getAllReminders } from '@/storage/financial-reminders-repository';
import { getAllContributions, getAllGoals } from '@/storage/goal-repository';
import { getAllIncome } from '@/storage/income-repository';
import { getNotesStrict, NOTES_STORAGE_KEY, replaceNotes } from '@/storage/notes-storage';
import { getTodosStrict, replaceTodos, TODOS_STORAGE_KEY } from '@/storage/todo-storage';
import { loadPreferences, PREFERENCES_STORAGE_KEY, savePreferences } from '@/storage/preferences-storage';
import {
  loadRecurringSkips,
  RECURRING_SKIPS_STORAGE_KEY,
  replaceRecurringSkips,
} from '@/storage/recurring-skips';
import type { DebtRecord } from '@/types/debt';
import type { Expense } from '@/types/expense';
import type { UserPreferences } from '@/types/preferences';
import { deleteLocalFile } from '@/utils/local-file';
import { cancelAllReminderNotificationsAsync } from '@/utils/reminder-notifications';
import { applyRestoreWithRollback, RestoreRollbackError } from '@/utils/restore-rollback';
import { runWithSaveQueueLock } from '@/utils/save-queue';
import { clearRestoreJournal, readRestoreJournal, writeRestoreJournal } from '@/storage/restore-journal';
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  MAX_BACKUP_ATTACHMENTS,
  MAX_EMBEDDED_ATTACHMENT_CHARS,
  listAttachmentUris,
  parseBackup,
  remapAttachmentUris,
  serializeBackup,
  type BackupAttachment,
  type BackupData,
  type BackupFile,
  type BackupRecurringSkips,
} from '@/utils/backup';

export const BACKUP_MIME_TYPE = 'application/json';

const BACKUP_STORAGE_KEYS = [
  EXPENSES_STORAGE_KEY,
  PREFERENCES_STORAGE_KEY,
  DEBT_STORAGE_KEY,
  NOTES_STORAGE_KEY,
  TODOS_STORAGE_KEY,
  RECURRING_SKIPS_STORAGE_KEY,
  APP_LOCK_STORAGE_KEY,
];

type RawStorageSnapshot = readonly (readonly [string, string | null])[];

type RestoreSnapshot = {
  storage: RawStorageSnapshot;
  relational: RelationalSnapshot;
};

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export type BackupSummary = {
  json: string;
  fileName: string;
  attachmentCount: number;
  omittedAttachments: number;
};

export type RestoreSummary = {
  attachmentsRestored: number;
  attachmentsOmitted: number;
  counts: {
    expenses: number;
    notes: number;
    debts: number;
    income: number;
    goals: number;
    contributions: number;
    reminders: number;
    payments: number;
  };
};

function skipSetsToSnapshot(skips: Record<string, Set<string>>): Record<string, string[]> {
  const snapshot: Record<string, string[]> = {};
  for (const [parentId, periods] of Object.entries(skips)) {
    snapshot[parentId] = [...periods];
  }
  return snapshot;
}

function extensionFor(attachment: BackupAttachment, uri: string): string {
  const fromMime = MIME_EXTENSIONS[attachment.mimeType];
  if (fromMime) return fromMime;
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(uri);
  return match ? match[1].toLowerCase() : 'jpg';
}

function backupFileName(now = new Date()): string {
  const stamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `CashTrack_Backup_${stamp}.json`;
}

async function collectAttachments(
  data: BackupData,
): Promise<{ attachments: Record<string, BackupAttachment>; omitted: number }> {
  const attachments: Record<string, BackupAttachment> = {};
  const uris = listAttachmentUris(data);

  if (Platform.OS === 'web') {
    return { attachments, omitted: uris.length };
  }

  let embeddedChars = 0;
  let included = 0;
  let omitted = 0;

  for (const uri of uris) {
    // Keep export within the same ceiling the importer enforces, otherwise a
    // large library would produce a backup that can never be restored.
    if (included >= MAX_BACKUP_ATTACHMENTS) {
      omitted += 1;
      continue;
    }
    try {
      if (!uri.startsWith('file://')) {
        omitted += 1;
        continue;
      }
      const file = new File(uri);
      if (!file.exists) {
        omitted += 1;
        continue;
      }
      const base64 = await file.base64();
      if (embeddedChars + base64.length > MAX_EMBEDDED_ATTACHMENT_CHARS) {
        omitted += 1;
        continue;
      }
      attachments[uri] = { mimeType: mimeTypeForUri(uri), data: base64 };
      embeddedChars += base64.length;
      included += 1;
    } catch (error) {
      console.warn('[cashtrack] Skipping an attachment that could not be read', error);
      omitted += 1;
    }
  }

  return { attachments, omitted };
}

function mimeTypeForUri(uri: string): string {
  const match = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(uri);
  const extension = match ? match[1].toLowerCase() : 'jpg';
  const mime = Object.entries(MIME_EXTENSIONS).find(([, ext]) => ext === extension);
  return mime ? mime[0] : 'image/jpeg';
}

/**
 * Live values from the running app. The AsyncStorage-backed collections save
 * through debounced queues, so passing the in-memory state avoids capturing a
 * backup a few milliseconds before the newest edit reaches storage.
 */
export type BackupSnapshot = {
  expenses?: Expense[];
  preferences?: UserPreferences;
  debts?: DebtRecord[];
};

/** Reads every stored collection and produces a self-contained JSON backup. */
export async function createBackup(snapshot: BackupSnapshot = {}): Promise<BackupSummary> {
  const [
    storedExpenses,
    storedPreferences,
    notes,
    todos,
    storedDebts,
    income,
    goals,
    contributions,
    reminders,
    payments,
    expenseSkips,
    incomeSkips,
  ] = await Promise.all([
    snapshot.expenses === undefined ? loadExpenses() : Promise.resolve(null),
    snapshot.preferences === undefined ? loadPreferences() : Promise.resolve(null),
    getNotesStrict(),
    getTodosStrict(),
    snapshot.debts === undefined ? loadDebts() : Promise.resolve(null),
    getAllIncome(),
    getAllGoals(),
    getAllContributions(),
    getAllReminders(),
    getAllPayments(),
    loadRecurringSkips('expense'),
    loadRecurringSkips('income'),
  ]);

  const preferences = snapshot.preferences ?? storedPreferences;
  if (!preferences) {
    throw new Error('Preferences are unavailable, so a backup cannot be created.');
  }

  const data: BackupData = {
    expenses: snapshot.expenses ?? storedExpenses ?? [],
    preferences,
    notes,
    todos,
    debts: snapshot.debts ?? storedDebts ?? [],
    income,
    goals,
    contributions,
    reminders,
    payments,
    recurringSkips: {
      expense: skipSetsToSnapshot(expenseSkips),
      income: skipSetsToSnapshot(incomeSkips),
    } satisfies BackupRecurringSkips,
    attachments: {},
  };

  const { attachments, omitted } = await collectAttachments(data);
  data.attachments = attachments;

  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: Constants.expoConfig?.version,
    data,
  };

  return {
    json: serializeBackup(file),
    fileName: backupFileName(),
    attachmentCount: Object.keys(attachments).length,
    omittedAttachments: omitted,
  };
}

function getRestoredDirectory(): Directory {
  const directory = new Directory(Paths.document, 'backup-restore');
  if (!directory.exists) {
    directory.create({ intermediates: true });
  }
  return directory;
}

async function restoreAttachments(
  attachments: Record<string, BackupAttachment>,
): Promise<{
  mapping: Record<string, string>;
  createdUris: string[];
  restored: number;
  omitted: number;
}> {
  const mapping: Record<string, string> = {};
  const createdUris: string[] = [];
  let restored = 0;
  let omitted = 0;
  const entries = Object.entries(attachments);
  if (entries.length === 0) return { mapping, createdUris, restored, omitted };

  const directory = getRestoredDirectory();
  let index = 0;

  for (const [originalUri, attachment] of entries) {
    let target: File | null = null;
    try {
      const extension = extensionFor(attachment, originalUri);
      target = new File(
        directory,
        `restored-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}.${extension}`,
      );
      target.create({ overwrite: true });
      target.write(attachment.data, { encoding: 'base64' });
      mapping[originalUri] = target.uri;
      createdUris.push(target.uri);
      restored += 1;
    } catch (error) {
      console.warn('[cashtrack] Could not restore an attachment', error);
      if (target) {
        await deleteLocalFile(target.uri);
      }
      omitted += 1;
    }
    index += 1;
  }

  return { mapping, createdUris, restored, omitted };
}

async function captureRestoreSnapshot(): Promise<RestoreSnapshot> {
  const [storage, relational] = await Promise.all([
    AsyncStorage.multiGet(BACKUP_STORAGE_KEYS),
    captureRelationalSnapshot(),
  ]);
  return { storage, relational };
}

async function restoreStorageSnapshot(snapshot: RawStorageSnapshot): Promise<void> {
  const present: [string, string][] = [];
  const missing: string[] = [];
  for (const [key, value] of snapshot) {
    if (value === null) {
      missing.push(key);
    } else {
      present.push([key, value]);
    }
  }

  const tasks: Promise<void>[] = [];
  if (present.length > 0) {
    tasks.push(AsyncStorage.multiSet(present));
  }
  if (missing.length > 0) {
    tasks.push(AsyncStorage.multiRemove(missing));
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    throw failed.reason;
  }
}

async function restorePreviousSnapshot(snapshot: RestoreSnapshot): Promise<void> {
  const results = await Promise.allSettled([
    replaceRelationalData(snapshot.relational),
    restoreStorageSnapshot(snapshot.storage),
  ]);
  const failed = results.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') {
    throw failed.reason;
  }
}

async function applyRestoreData(data: BackupData): Promise<void> {
  await replaceRelationalData(data);
  await saveExpenses(data.expenses);
  await savePreferences(data.preferences);
  await saveDebts(data.debts);
  await replaceNotes(data.notes);
  await replaceTodos(data.todos ?? []);
  await replaceRecurringSkips(data.recurringSkips);
  await saveAppLockFlag(data.preferences.appLockEnabled === true);
}

/**
 * Replaces every local collection with the contents of a backup file. The file
 * is fully validated before any existing data is removed.
 */
export async function restoreBackup(raw: string): Promise<RestoreSummary> {
  if (Platform.OS === 'web') {
    throw new Error('Restoring a backup is available in the iOS and Android app.');
  }

  const parsed = parseBackup(raw);

  return runWithSaveQueueLock(async () => {
    const snapshot = await captureRestoreSnapshot();
    const { mapping, createdUris, restored, omitted } = await restoreAttachments(parsed.data.attachments);
    const data = remapAttachmentUris(parsed.data, mapping);

    try {
      // Persist the intent first so a crash mid-restore can be completed on the
      // next launch instead of leaving SQLite and AsyncStorage out of sync.
      await writeRestoreJournal(data);
    } catch (error) {
      await Promise.all(createdUris.map((uri) => deleteLocalFile(uri)));
      throw error;
    }

    try {
      await applyRestoreWithRollback(
        snapshot,
        () => applyRestoreData(data),
        async (previous) => {
          await restorePreviousSnapshot(previous);
          await Promise.all(createdUris.map((uri) => deleteLocalFile(uri)));
        },
      );
    } catch (error) {
      if (error instanceof RestoreRollbackError) {
        console.error('[cashtrack] Restore failed and rollback was incomplete', error.originalError, error.rollbackError);
        // Keep the journal: the next launch replays the restore forward.
      } else {
        await clearRestoreJournal();
      }
      throw error;
    }

    await clearRestoreJournal();

    // Old reminders are gone, so their scheduled notifications must not fire.
    // The reminders provider reschedules the restored active bills afterwards.
    await cancelAllReminderNotificationsAsync();

    return {
      attachmentsRestored: restored,
      attachmentsOmitted: omitted,
      counts: {
        expenses: data.expenses.length,
        notes: data.notes.length,
        debts: data.debts.length,
        income: data.income.length,
        goals: data.goals.length,
        contributions: data.contributions.length,
        reminders: data.reminders.length,
        payments: data.payments.length,
      },
    };
  });
}

/**
 * Replays an interrupted restore. Called before the providers mount so the
 * first read sees a consistent data set. Safe to run repeatedly: every
 * collection is replaced wholesale.
 */
export async function recoverPendingRestore(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const data = await readRestoreJournal();
  if (!data) return false;

  await runWithSaveQueueLock(async () => {
    await applyRestoreData(data);
    await clearRestoreJournal();
  });

  await cancelAllReminderNotificationsAsync();
  return true;
}

/** Opens the system picker and returns the selected backup's text, or null when canceled. */
export async function pickBackupFile(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const result = await File.pickFileAsync({
    mimeTypes: [BACKUP_MIME_TYPE, 'text/plain', 'application/octet-stream'],
  });
  if (result.canceled) return null;
  return result.result.text();
}
