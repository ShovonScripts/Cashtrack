import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { BackupData } from '@/utils/backup';
import { parseRestoreJournal, serializeRestoreJournal } from './restore-journal-codec.ts';

/**
 * A durable "restore in progress" marker.
 *
 * SQLite and AsyncStorage cannot be committed atomically together, so a crash
 * between the two writes could leave the app with a mix of old and restored
 * data. The journal stores the fully-remapped restore payload *before* anything
 * is overwritten. If the process dies mid-restore, the next launch replays the
 * journal, which is idempotent, so the user ends up with either their old data
 * or the complete backup — never a partial merge.
 */

const JOURNAL_FILE_NAME = 'cashtrack-pending-restore.json';

function journalFile(): File {
  return new File(Paths.document, JOURNAL_FILE_NAME);
}

function tempFile(): File {
  return new File(Paths.document, `${JOURNAL_FILE_NAME}.tmp`);
}

/**
 * Writes the pending restore payload atomically (temp file + rename) before any
 * existing data is replaced. `attachments` is intentionally omitted: the files
 * were already written to the document directory and the payload only carries
 * their final `file://` URIs.
 */
export async function writeRestoreJournal(data: BackupData): Promise<void> {
  if (Platform.OS === 'web') return;

  const temp = tempFile();
  if (temp.exists) temp.delete();
  temp.create({ overwrite: true });
  temp.write(serializeRestoreJournal(data));
  await temp.move(journalFile(), { overwrite: true });
}

/** Returns the pending restore payload, or null when none exists. */
export async function readRestoreJournal(): Promise<BackupData | null> {
  if (Platform.OS === 'web') return null;

  const file = journalFile();
  if (!file.exists) return null;

  try {
    const data = parseRestoreJournal(await file.text());
    if (!data) {
      console.warn('[cashtrack] Ignoring an invalid restore journal');
      await clearRestoreJournal();
      return null;
    }
    return data;
  } catch (error) {
    console.warn('[cashtrack] Could not read the restore journal', error);
    await clearRestoreJournal();
    return null;
  }
}

export async function clearRestoreJournal(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const file = journalFile();
    if (file.exists) file.delete();
  } catch (error) {
    console.warn('[cashtrack] Could not clear the restore journal', error);
  }
}
