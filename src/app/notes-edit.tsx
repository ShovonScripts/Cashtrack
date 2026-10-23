import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteNote, getNotes, saveNote } from '@/storage/notes-storage';
import { Note, NoteColor } from '@/types/note';
import { confirmDelete, notify } from '@/utils/confirm';

const COLORS: { key: NoteColor; label: string; hex: string; darkHex: string }[] = [
  { key: 'default', label: 'Default', hex: '#F7F7F9', darkHex: '#17181A' },
  { key: 'red', label: 'Red', hex: '#FEE2E2', darkHex: '#451A03' },
  { key: 'blue', label: 'Blue', hex: '#E0F2FE', darkHex: '#082F49' },
  { key: 'green', label: 'Green', hex: '#DCFCE7', darkHex: '#064E3B' },
  { key: 'yellow', label: 'Yellow', hex: '#FEF9C3', darkHex: '#422006' },
  { key: 'purple', label: 'Purple', hex: '#F3E8FF', darkHex: '#3B0764' },
];

export default function EditNoteScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [missingId, setMissingId] = useState<string | null>(null);

  const isLoading = Boolean(id) && loadedId !== id && missingId !== id;
  const notFound = !id || missingId === id;

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    getNotes()
      .then((notes) => {
        if (cancelled) return;
        const found = notes.find((n) => n.id === id);
        if (!found) {
          setMissingId(id);
          return;
        }
        setTitle(found.title);
        setContent(found.content);
        setColor(found.color);
        setLoadedId(id);
      })
      .catch(() => {
        if (!cancelled) {
          notify('Could not open note', 'Your saved notes could not be read. Please restart the app and try again.');
          setMissingId(id);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSave = async () => {
    if (!id || isLoading || notFound) return;
    const updatedNote: Note = {
      id,
      title: title.trim(),
      content: content.trim(),
      color,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveNote(updatedNote);
      router.back();
    } catch {
      notify('Could not save note', 'Your saved notes could not be read. Please restart the app and try again.');
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    confirmDelete('Delete Note', 'Are you sure you want to delete this note?', async () => {
      try {
        await deleteNote(id);
        router.back();
      } catch {
        notify('Could not delete note', 'Your saved notes could not be read. Please restart the app and try again.');
      }
    });
  };

  const selectedColorObj = COLORS.find((c) => c.key === color) || COLORS[0];
  const isDark = theme.text === '#ffffff';
  const dynamicBg = isDark ? selectedColorObj.darkHex : selectedColorObj.hex;

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Edit Note' }} />
        <ActivityIndicator size="large" color={theme.accent} />
      </ThemedView>
    );
  }

  if (notFound) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <Stack.Screen options={{ title: 'Edit Note' }} />
        <ThemedText type="subtitle">Note not found</ThemedText>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={{ marginTop: Spacing.three }}>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>← Back</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: dynamicBg }]}>
      <Stack.Screen
        options={{
          title: 'Edit Note',
          headerStyle: { backgroundColor: dynamicBg },
          headerRight: () => (
            <View style={styles.headerActions}>
              <Pressable
                onPress={handleDelete}
                accessibilityRole="button"
                accessibilityLabel="Delete note"
                hitSlop={6}
                style={[styles.iconBtn, { backgroundColor: `${theme.danger}15` }]}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
              <Pressable
                onPress={handleSave}
                accessibilityRole="button"
                accessibilityLabel="Save changes"
                style={[styles.saveHeaderBtn, { backgroundColor: theme.accentFill }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Save</ThemedText>
              </Pressable>
            </View>
          ),
        }}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Color Palette Picker */}
        <View style={styles.colorRow}>
          {COLORS.map((c) => {
            const selected = color === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => setColor(c.key)}
                accessibilityRole="button"
                accessibilityLabel={`Note color ${c.key}`}
                accessibilityState={{ selected }}
                hitSlop={4}
                style={[
                  styles.colorCircle,
                  { backgroundColor: isDark ? c.darkHex : c.hex },
                  selected && { borderWidth: 2.5, borderColor: theme.accent },
                ]}
              />
            );
          })}
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Note title"
          style={[styles.titleInput, { color: theme.text }]}
        />

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Note content..."
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Note content"
          multiline
          style={[styles.contentInput, { color: theme.text }]}
        />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveHeaderBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  scrollContent: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: 80,
  },
  colorRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
  },
  titleInput: {
    fontSize: 22,
    fontWeight: '700',
    paddingVertical: Spacing.one,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
    textAlignVertical: 'top',
  },
});
