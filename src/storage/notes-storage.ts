import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Note } from '@/types/note';
import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';

const STORAGE_KEY = '@cashtrack_google_keep_notes';

const noteRows = objectRows<Note>('note');

/**
 * Read-only access for screens. A corrupt payload is reported as empty so the
 * UI can still render, but mutators below read strictly and abort instead of
 * overwriting the user's notes with an empty list.
 */
export async function getNotes(): Promise<Note[]> {
  try {
    return await readJsonArray(AsyncStorage, STORAGE_KEY, 'notes', noteRows);
  } catch (error) {
    console.error('[cashtrack] Failed to read notes', error);
    return [];
  }
}

export async function saveNote(note: Note): Promise<void> {
  await mutateJsonArray(AsyncStorage, STORAGE_KEY, 'notes', noteRows, (notes) => {
    const index = notes.findIndex((n) => n.id === note.id);
    if (index >= 0) {
      const updated = [...notes];
      updated[index] = note;
      return updated;
    }
    return [note, ...notes];
  });
}

export async function deleteNote(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, STORAGE_KEY, 'notes', noteRows, (notes) =>
    notes.filter((n) => n.id !== id)
  );
}

/** Removes every note. Used by the full "reset all data" flow. */
export async function clearNotes(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
