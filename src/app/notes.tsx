import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card } from '@/components/card';
import { EmptyState } from '@/components/empty-state';
import { LoadErrorState } from '@/components/load-error-state';
import { NoteCard } from '@/components/notes/note-card';
import { ThemedText } from '@/components/themed-text';
import { IconButton, Screen, SearchField, SkeletonList } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { getNotesStrict } from '@/storage/notes-storage';
import type { Note } from '@/types/note';
import { triggerHaptic } from '@/utils/motion';

export default function NotesIndexScreen() {
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [search, setSearch] = useState('');
  const [isGrid, setIsGrid] = useState(true);

  const loadNotes = useCallback(async () => {
    try {
      setNotes(await getNotesStrict());
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [loadNotes]),
  );

  const openNew = () => {
    triggerHaptic();
    router.push('/notes-add');
  };

  const query = search.trim().toLowerCase();
  const all = notes ?? [];
  const filtered = query
    ? all.filter((n) => n.title.toLowerCase().includes(query) || n.content.toLowerCase().includes(query))
    : all;

  const emptyContent =
    notes === null && !loadFailed ? (
      <SkeletonList rows={3} label="Loading your notes" />
    ) : loadFailed ? (
      <Card>
        <LoadErrorState
          title="Couldn't load your notes"
          message="Your notes couldn't be read just now. Nothing has been deleted."
          isRetrying={isRetrying}
          onRetry={async () => {
            setIsRetrying(true);
            await loadNotes();
            setIsRetrying(false);
          }}
        />
      </Card>
    ) : (
      <Card>
        <EmptyState
          title={all.length === 0 ? 'No notes yet' : 'No matching notes'}
          message={
            all.length === 0
              ? 'Jot down shopping lists, plans or anything you want to remember.'
              : 'Try a different word, or clear the search.'
          }
          icon="file-document-outline"
          actionLabel={all.length === 0 ? 'Write a note' : undefined}
          onAction={all.length === 0 ? openNew : undefined}
        />
      </Card>
    );

  return (
    <Screen scroll={false} topInset={false} contentStyle={styles.fill}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon={isGrid ? 'view-list-outline' : 'view-grid-outline'}
                label={isGrid ? 'Show as list' : 'Show as grid'}
                onPress={() => {
                  triggerHaptic();
                  setIsGrid((g) => !g);
                }}
              />
              <IconButton icon="add" label="New note" onPress={openNew} />
            </View>
          ),
        }}
      />

      <View style={styles.searchBlock}>
        <SearchField value={search} onChangeText={setSearch} placeholder="Search notes" label="Search notes" />
        {notes ? (
          <ThemedText type="caption" themeColor="textSecondary">
            {query ? `${filtered.length} of ${all.length}` : all.length} note{all.length === 1 ? '' : 's'}
          </ThemedText>
        ) : null}
      </View>

      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? styles.row : undefined}
        style={styles.fill}
        contentContainerStyle={[styles.list, { paddingBottom: Spacing.four + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={emptyContent}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            compact={isGrid}
            onPress={() => {
              triggerHaptic();
              router.push({ pathname: '/notes-edit', params: { id: item.id } });
            }}
          />
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  searchBlock: { gap: Spacing.two },
  list: { gap: Spacing.two },
  row: { gap: Spacing.two },
});
