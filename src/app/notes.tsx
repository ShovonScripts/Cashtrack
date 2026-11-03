import { useCallback, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { Icon, IconButton } from '@/components/ui';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getNotes } from '@/storage/notes-storage';
import { Note, NoteColor } from '@/types/note';

const COLOR_MAP: Record<NoteColor, { lightBg: string; darkBg: string; border: string }> = {
  default: { lightBg: '#F7F7F9', darkBg: '#1C1D21', border: 'rgba(150, 150, 150, 0.2)' },
  red: { lightBg: '#FEE2E2', darkBg: '#3F1515', border: 'rgba(239, 68, 68, 0.35)' },
  blue: { lightBg: '#E0F2FE', darkBg: '#102A43', border: 'rgba(59, 130, 246, 0.35)' },
  green: { lightBg: '#DCFCE7', darkBg: '#064E3B', border: 'rgba(16, 185, 129, 0.35)' },
  yellow: { lightBg: '#FEF9C3', darkBg: '#3E2723', border: 'rgba(245, 158, 11, 0.35)' },
  purple: { lightBg: '#F3E8FF', darkBg: '#2E1065', border: 'rgba(139, 92, 246, 0.35)' },
};

export default function NotesIndexScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [notes, setNotes] = useState<Note[]>([]);
  const [search, setSearch] = useState<string>('');
  const [isGrid, setIsGrid] = useState<boolean>(true);

  const isDark = theme.background !== '#ffffff';

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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <IconButton
              icon={isGrid ? 'view-list-outline' : 'view-grid-outline'}
              label={isGrid ? 'Switch to list view' : 'Switch to grid view'}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsGrid(!isGrid);
              }}
            />
          ),
        }}
      />
      <View style={styles.searchBlock}>
        <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Icon name="search" size="md" color={theme.textSecondary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search notes..."
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Search notes"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {search.length > 0 && (
            <IconButton icon="close-circle" label="Clear search" onPress={() => setSearch('')} />
          )}
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          {notes.length} saved note{notes.length === 1 ? '' : 's'}
        </ThemedText>
      </View>

      <FlatList
        key={isGrid ? 'grid' : 'list'}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140 + insets.bottom }]}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? styles.columnWrapper : undefined}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Icon name="file-document-outline" size="xl" />
            <ThemedText type="defaultBold" style={styles.emptyTitle}>
              No notes found
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.emptySubtitle}>
              Tap the plus button below to create your first note.
            </ThemedText>
          </Card>
        }
        renderItem={({ item }) => {
          const styling = COLOR_MAP[item.color] || COLOR_MAP.default;
          const bg = isDark ? styling.darkBg : styling.lightBg;
          return (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/notes-edit?id=${item.id}` as any);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.title ? `Edit note: ${item.title}` : 'Edit note'}
              style={({ pressed }) => [
                styles.noteCardWrapper,
                !isGrid && styles.fullWidthWrapper,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
              ]}>
              <View
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: bg,
                    borderColor: styling.border,
                  },
                ]}>
                {item.title ? (
                  <ThemedText type="defaultBold" numberOfLines={2} style={[styles.noteTitle, { color: theme.text }]}>
                    {item.title}
                  </ThemedText>
                ) : null}
                <ThemedText type="caption" numberOfLines={isGrid ? 5 : 3} style={[styles.noteContent, { color: theme.textSecondary }]}>
                  {item.content || 'Empty note'}
                </ThemedText>
                <ThemedText type="caption" style={[styles.dateText, { color: theme.textSecondary }]}>
                  {new Date(item.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </ThemedText>
              </View>
            </Pressable>
          );
        }}
      />

      {/* Floating Action Button (FAB) */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push('/notes-add' as any);
        }}
        accessibilityRole="button"
        accessibilityLabel="Add note"
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accentFill, shadowColor: theme.accent, bottom: Math.max(Spacing.four, insets.bottom + 16) },
          pressed && { transform: [{ scale: 0.93 }] },
        ]}>
        <Icon name="add" size="lg" color={Palette.white} />
      </Pressable>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  searchBlock: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.two, gap: Spacing.two },
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
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
  fullWidthWrapper: {
    width: '100%',
  },
  noteCard: {
    borderRadius: Radius.large,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.one,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  noteTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  noteContent: {
    fontSize: 13,
    lineHeight: 19,
  },
  dateText: {
    fontSize: 11,
    marginTop: Spacing.half,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
    marginTop: Spacing.four * 2,
  },
  emptyTitle: {
    marginTop: Spacing.one,
    textAlign: 'center',
    fontSize: 18,
  },
  emptySubtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 99,
  },
});
