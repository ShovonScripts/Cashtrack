import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/card';
import { Radius, Spacing } from '@/constants/theme';
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

  const isDark = theme.text === '#ffffff';

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
          { paddingTop: Math.max(insets.top + Spacing.one, Spacing.two), backgroundColor: theme.background },
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="arrow-back" size={18} color={theme.text} />
            </Pressable>
            <View>
              <ThemedText type="title">Keep Notes</ThemedText>
              <ThemedText type="caption" themeColor="textSecondary">
                {notes.length} saved note{notes.length === 1 ? '' : 's'}
              </ThemedText>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsGrid(!isGrid);
              }}
              style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name={isGrid ? 'list-outline' : 'grid-outline'} size={18} color={theme.text} />
            </Pressable>
          </View>
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
        key={isGrid ? 'grid' : 'list'}
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 140 + insets.bottom }]}
        numColumns={isGrid ? 2 : 1}
        columnWrapperStyle={isGrid ? styles.columnWrapper : undefined}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={48} color={theme.accent} />
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
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.accentFill, shadowColor: theme.accent },
          pressed && { transform: [{ scale: 0.93 }] },
        ]}>
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
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
