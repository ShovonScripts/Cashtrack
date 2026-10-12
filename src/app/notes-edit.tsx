import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { deleteNote, getNotes, saveNote } from '@/storage/notes-storage';
import { Note, NoteColor } from '@/types/note';
import { confirmDelete } from '@/utils/confirm';

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

  useEffect(() => {
    if (!id) return;
    getNotes().then((notes) => {
      const found = notes.find((n) => n.id === id);
      if (found) {
        setTitle(found.title);
        setContent(found.content);
        setColor(found.color);
      }
    });
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    const updatedNote: Note = {
      id,
      title: title.trim(),
      content: content.trim(),
      color,
      updatedAt: new Date().toISOString(),
    };
    await saveNote(updatedNote);
    router.back();
  };

  const handleDelete = async () => {
    if (!id) return;
    confirmDelete('Delete Note', 'Are you sure you want to delete this note?', async () => {
      await deleteNote(id);
      router.back();
    });
  };

  const selectedColorObj = COLORS.find((c) => c.key === color) || COLORS[0];
  const isDark = theme.text === '#ffffff';
  const dynamicBg = isDark ? selectedColorObj.darkHex : selectedColorObj.hex;

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
                style={[styles.iconBtn, { backgroundColor: `${theme.danger}15` }]}>
                <Ionicons name="trash-outline" size={18} color={theme.danger} />
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.saveHeaderBtn, { backgroundColor: theme.accent }]}>
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Save</ThemedText>
              </Pressable>
            </View>
          ),
        }}
      />

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
          style={[styles.titleInput, { color: theme.text }]}
        />

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Note content..."
          placeholderTextColor={theme.textSecondary}
          multiline
          style={[styles.contentInput, { color: theme.text }]}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
