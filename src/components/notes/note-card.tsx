import { Pressable, StyleSheet } from 'react-native';

import { Card } from '@/components/card';
import { noteTint } from '@/components/notes/note-tint';
import { ThemedText } from '@/components/themed-text';
import { PressFeedback, Spacing } from '@/constants/theme';
import { useIsDark, useTheme } from '@/hooks/use-theme';
import type { Note } from '@/types/note';

type NoteCardProps = {
  note: Note;
  /** Grid tiles show more lines of the note and share the row. */
  compact: boolean;
  onPress: () => void;
};

/** One note in the Notes list or grid. */
export function NoteCard({ note, compact, onPress }: NoteCardProps) {
  const theme = useTheme();
  const isDark = useIsDark();
  const { fill, edge } = noteTint(note.color, theme, isDark, 'card');
  const date = new Date(note.updatedAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={note.title ? `Edit note: ${note.title}` : 'Edit note'}
      accessibilityHint={`Last edited ${date}`}
      style={({ pressed }) => [styles.wrapper, pressed && PressFeedback]}>
      <Card style={[styles.card, { backgroundColor: fill, borderColor: edge }]}>
        {note.title ? (
          <ThemedText type="defaultBold" numberOfLines={2}>
            {note.title}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={compact ? 5 : 3} style={styles.body}>
          {note.content || 'Empty note'}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {date}
        </ThemedText>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: { flex: 1, gap: Spacing.one, minHeight: 140 },
  body: { flex: 1 },
});
