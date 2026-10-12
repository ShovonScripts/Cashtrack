import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note } from '@/types/note';

const STORAGE_KEY = '@cashtrack_google_keep_notes';

export async function getNotes(): Promise<Note[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return [];
    return JSON.parse(json) as Note[];
  } catch {
    return [];
  }
}

export async function saveNote(note: Note): Promise<void> {
  const notes = await getNotes();
  const index = notes.findIndex((n) => n.id === note.id);
  let updated: Note[];
  if (index >= 0) {
    updated = [...notes];
    updated[index] = note;
  } else {
    updated = [note, ...notes];
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await getNotes();
  const updated = notes.filter((n) => n.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}
