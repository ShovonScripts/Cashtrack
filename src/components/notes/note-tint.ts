import { NoteColors } from '@/constants/theme';
import type { useTheme } from '@/hooks/use-theme';
import type { NoteColor } from '@/types/note';

type Theme = ReturnType<typeof useTheme>;

export const NOTE_COLOR_OPTIONS: { key: NoteColor; label: string }[] = [
  { key: 'default', label: 'No colour' },
  { key: 'red', label: 'Red' },
  { key: 'blue', label: 'Blue' },
  { key: 'green', label: 'Green' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'purple', label: 'Purple' },
];

/**
 * Fill and outline for a note. Untinted notes use the theme: a card in the
 * list, the page background in the editor.
 */
export function noteTint(
  color: NoteColor,
  theme: Theme,
  isDark: boolean,
  surface: 'card' | 'page',
): { fill: string; edge: string } {
  const tint = color === 'default' ? undefined : NoteColors[color];
  if (!tint) {
    return { fill: surface === 'card' ? theme.card : theme.background, edge: theme.cardBorder };
  }
  return { fill: isDark ? tint.dark : tint.light, edge: tint.edge };
}
