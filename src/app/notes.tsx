import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getNotes } from '@/storage/notes-storage';
import { Note, NoteColor } from '@/types/note';

const COLOR_MAP: Record<NoteColor, { bg: string; border: string }> = {
  default: { bg: '#F7F7F9', border: '#E6E6EA' },
  red: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)' },
  blue: { bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.3)' },
  green: { bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.3)' },
  yellow: { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)' },
  purple: { bg: 'rgba(139, 92, 246, 0.12)', border: 'rgba(139, 92, 246, 0.3)' },
};

export default function NotesIndexScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState<string>('');

  const loadNotes = async () => {
    const data = await getNotes();
    setNotes(data);
  };

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [])
  );

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.headerContainer,
          { paddingTop: Math.max(insets.top + Spacing.two, Spacing.four), backgroundColor: theme.background },
        ]}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="title">Keep Notes</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {notes.length} saved note{notes.length === 1 ? '' : 's'}
            </ThemedText>
          </View>
          <Pressable
            onPress={() => router.push('/notes-add' as any)}
            style={[styles.addButton, { backgroundColor: theme.accent }]}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}>
          <Ionicons name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 + insets.bottom }]}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color={theme.textSecondary} />
            <ThemedText type="defaultBold" style={styles.emptyTitle}>
              No notes found
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.emptySubtitle}>
              Tap the plus button above to create your first Google Keep style note.
            </ThemedText>
          </Card>
        }
        renderItem={({ item }) => {
          const styling = COLOR_MAP[item.color] || COLOR_MAP.default;
          return (
            <Pressable
              onPress={() => router.push(`/notes-edit?id=${item.id}` as any)}
              style={({ pressed }) => [styles.noteCardWrapper, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
              <View
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: styling.bg,
                    borderColor: styling.border,
                  },
                ]}>
                {item.title ? (
                  <ThemedText type="defaultBold" numberOfLines={2} style={styles.noteTitle}>
                    {item.title}
                  </ThemedText>
                ) : null}
                <ThemedText type="caption" numberOfLines={5} style={[styles.noteContent, { color: theme.textSecondary }]}>
                  {item.content || 'Empty note'}
                </ThemedText>
                <ThemedText type="caption" style={[styles.dateText, { color: theme.textSecondary }]}>
                  {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  listContent: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  columnWrapper: {
    gap: Spacing.two,
  },
  noteCardWrapper: {
    flex: 1,
  },
  noteCard: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.one,
    minHeight: 130,
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  dateText: {
    fontSize: 10,
    marginTop: Spacing.half,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.one,
    marginTop: Spacing.four,
  },
  emptyTitle: {
    marginTop: Spacing.one,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
});
