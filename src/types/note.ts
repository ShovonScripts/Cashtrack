export type NoteColor = 'default' | 'red' | 'blue' | 'green' | 'yellow' | 'purple';

export type Note = {
  id: string;
  title: string;
  content: string;
  color: NoteColor;
  updatedAt: string;
};
