import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { EmptyState } from '@/components/empty-state';
import { NoteEditor, type NoteDraft } from '@/components/notes/note-editor';
import { Screen, SkeletonList } from '@/components/ui';
import { deleteNote, getNotes, saveNote } from '@/storage/notes-storage';
import { confirmDelete, notify } from '@/utils/confirm';

export default function EditNoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loaded, setLoaded] = useState<{ id: string; note: NoteDraft } | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);

  const notFound = !id || missingId === id;
  const isLoading = !notFound && loaded?.id !== id;

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    getNotes()
      .then((notes) => {
        if (cancelled) return;
        const found = notes.find((n) => n.id === id);
        if (found) setLoaded({ id, note: { title: found.title, content: found.content, color: found.color } });
        else setMissingId(id);
      })
      .catch(() => {
        if (!cancelled) setMissingId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ title: 'Edit Note' }} />
        <SkeletonList rows={3} label="Loading note" />
      </Screen>
    );
  }

  if (notFound || !loaded) {
    return (
      <Screen topInset={false}>
        <Stack.Screen options={{ title: 'Edit Note' }} />
        <EmptyState
          title="Note not found"
          message="This note may have been deleted, or your notes could not be read just now."
          icon="file-document-outline"
          actionLabel="Back to notes"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const handleDelete = () => {
    confirmDelete('Delete note', 'This note will be removed for good.', async () => {
      try {
        await deleteNote(loaded.id);
        router.back();
      } catch {
        notify('Could not delete note', 'Your saved notes could not be read. Please restart the app and try again.');
      }
    });
  };

  return (
    <NoteEditor
      key={loaded.id}
      screenTitle="Edit Note"
      submitLabel="Save changes"
      initialValues={loaded.note}
      onCancel={() => router.back()}
      onDelete={handleDelete}
      onSave={async (note) => {
        await saveNote({ id: loaded.id, ...note, updatedAt: new Date().toISOString() });
        router.back();
      }}
    />
  );
}
