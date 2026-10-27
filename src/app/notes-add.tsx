import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { saveNote } from '@/storage/notes-storage';
import { NoteColor } from '@/types/note';
import { notify } from '@/utils/confirm';

const COLORS: { key: NoteColor; label: string; hex: string; darkHex: string }[] = [
  { key: 'default', label: 'Default', hex: '#F7F7F9', darkHex: '#17181A' },
  { key: 'red', label: 'Red', hex: '#FEE2E2', darkHex: '#451A03' },
  { key: 'blue', label: 'Blue', hex: '#E0F2FE', darkHex: '#082F49' },
  { key: 'green', label: 'Green', hex: '#DCFCE7', darkHex: '#064E3B' },
  { key: 'yellow', label: 'Yellow', hex: '#FEF9C3', darkHex: '#422006' },
  { key: 'purple', label: 'Purple', hex: '#F3E8FF', darkHex: '#3B0764' },
];

export default function AddNoteScreen() {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<NoteColor>('default');

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) {
      router.back();
      return;
    }
    const newNote = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      color,
      updatedAt: new Date().toISOString(),
    };
    try {
      await saveNote(newNote);
      router.back();
    } catch {
      notify('Could not save note', 'Your saved notes could not be read. Please restart the app and try again.');
    }
  };

  const selectedColorObj = COLORS.find((c) => c.key === color) || COLORS[0];
  const isDark = theme.background !== '#ffffff';
  const dynamicBg = isDark ? selectedColorObj.darkHex : selectedColorObj.hex;

  return (
    <ThemedView style={[styles.container, { backgroundColor: dynamicBg }]}>
      <Stack.Screen
        options={{
          title: 'New Note',
          headerStyle: { backgroundColor: dynamicBg },
          headerRight: () => (
            <Pressable
              onPress={handleSave}
              accessibilityRole="button"
              accessibilityLabel="Save note"
              style={[styles.saveHeaderBtn, { backgroundColor: theme.accentFill }]}>
              <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>Save</ThemedText>
            </Pressable>
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
