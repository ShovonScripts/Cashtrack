import { router } from 'expo-router';

import { NoteEditor } from '@/components/notes/note-editor';
import { saveNote } from '@/storage/notes-storage';

export default function AddNoteScreen() {
  return (
    <NoteEditor
      screenTitle="New Note"
      submitLabel="Save note"
      onCancel={() => router.back()}
      onSave={async ({ title, content, color }) => {
        // Nothing written: leave without creating an empty note.
        if (title || content) {
          await saveNote({ id: Date.now().toString(), title, content, color, updatedAt: new Date().toISOString() });
        }
        router.back();
      }}
    />
  );
}
