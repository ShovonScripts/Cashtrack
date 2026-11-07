import { Stack } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { NOTE_COLOR_OPTIONS, noteTint } from '@/components/notes/note-tint';
import { ThemedText } from '@/components/themed-text';
import { Button, Icon, IconButton, Screen } from '@/components/ui';
import { MinTouchTarget, Radius, Spacing, Typography } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { NoteColor } from '@/types/note';
import { triggerHaptic } from '@/utils/motion';

export type NoteDraft = { title: string; content: string; color: NoteColor };

type NoteEditorProps = {
  screenTitle: string;
  initialValues?: NoteDraft;
  submitLabel: string;
  /** Receives the trimmed note. Throw to keep the editor open with an error. */
  onSave: (note: NoteDraft) => Promise<void>;
  onCancel: () => void;
  /** Shows a delete button in the header (editing only). */
  onDelete?: () => void;
};

const EMPTY: NoteDraft = { title: '', content: '', color: 'default' };
const SWATCH = 32;

/** The New note and Edit note page: colour, title and body on a tinted page. */
export function NoteEditor({ screenTitle, initialValues, submitLabel, onSave, onCancel, onDelete }: NoteEditorProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const initial = initialValues ?? EMPTY;

  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [color, setColor] = useState<NoteColor>(initial.color);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const page = noteTint(color, theme, isDark, 'page').fill;

  const handleSave = async () => {
    if (isSaving) return;
    triggerHaptic();
    setIsSaving(true);
    setSaveError('');
    try {
      await onSave({ title: title.trim(), content: content.trim(), color });
    } catch {
      setSaveError('Could not save the note. Please restart the app and try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerStyle: { backgroundColor: page },
          headerRight: onDelete
            ? () => <IconButton icon="delete" label="Delete note" tone="danger" onPress={onDelete} />
            : undefined,
        }}
      />
      <Screen topInset={false} backgroundColor={page}>
        <View style={styles.field}>
          <ThemedText type="smallBold">Colour</ThemedText>
          <View accessibilityRole="radiogroup" accessibilityLabel="Note colour" style={styles.swatches}>
            {NOTE_COLOR_OPTIONS.map((option) => {
              const selected = color === option.key;
              const swatch = noteTint(option.key, theme, isDark, 'card');
              return (
                <Pressable
                  key={option.key}
                  onPress={() => {
                    triggerHaptic();
                    setColor(option.key);
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: selected }}
                  style={styles.swatchTarget}>
                  <View
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: swatch.fill,
                        borderColor: selected ? theme.accent : theme.border,
                        borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                      },
                    ]}>
                    {selected ? <Icon name="check" size="sm" color={theme.accent} /> : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Note title"
          maxLength={120}
          style={[styles.titleInput, { color: theme.text }]}
        />

        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Start writing…"
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Note text"
          multiline
          style={[styles.bodyInput, { color: theme.text }]}
        />

        {saveError ? (
          <ThemedText type="caption" themeColor="danger" accessibilityLiveRegion="polite">
            {saveError}
          </ThemedText>
        ) : null}

        <Button label={submitLabel} onPress={handleSave} loading={isSaving} />
        <Button label="Cancel" variant="ghost" onPress={onCancel} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  field: { gap: Spacing.one },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  swatchTarget: {
    width: MinTouchTarget,
    height: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInput: {
    ...Typography.title,
    fontWeight: '700',
    paddingVertical: Spacing.one,
  },
  bodyInput: {
    ...Typography.body,
    minHeight: 240,
    paddingVertical: 0,
    textAlignVertical: 'top',
  },
});
