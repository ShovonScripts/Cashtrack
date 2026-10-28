import type { BackupData } from '../utils/backup.ts';

export const RESTORE_JOURNAL_VERSION = 1;

export type RestoreJournal = {
  version: number;
  createdAt: string;
  data: BackupData;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isBackupDataShape(value: unknown): value is BackupData {
  if (!isRecord(value)) return false;
  const arrayKeys = [
    'expenses',
    'notes',
    'debts',
    'income',
    'goals',
    'contributions',
    'reminders',
    'payments',
  ] as const;
  return (
    arrayKeys.every((key) => Array.isArray(value[key]))
    && isRecord(value.preferences)
    && isRecord(value.recurringSkips)
    && (value.todos === undefined || Array.isArray(value.todos))
  );
}

/**
 * Builds the durable journal payload. `attachments` is intentionally empty:
 * restore files already live in the document directory and the data only keeps
 * their final `file://` URIs.
 */
export function createRestoreJournal(
  data: BackupData,
  createdAt: string = new Date().toISOString(),
): RestoreJournal {
  return {
    version: RESTORE_JOURNAL_VERSION,
    createdAt,
    data: { ...data, attachments: {} },
  };
}

export function serializeRestoreJournal(
  data: BackupData,
  createdAt?: string,
): string {
  return JSON.stringify(createRestoreJournal(data, createdAt));
}

/** Returns the journal payload, or null when the file is malformed or stale. */
export function parseRestoreJournal(raw: string): BackupData | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (
    !isRecord(parsed)
    || parsed.version !== RESTORE_JOURNAL_VERSION
    || !isBackupDataShape(parsed.data)
  ) {
    return null;
  }

  return parsed.data;
}
