import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  clearCompletedTodos,
  deleteTodo,
  getTodos,
  saveTodo,
  toggleTodo,
} from '@/storage/todo-storage';
import type { TodoCategory, TodoItem, TodoPriority } from '@/types/todo';

const PRIORITY_OPTIONS: { key: TodoPriority; label: string; color: string; icon: string }[] = [
  { key: 'high', label: 'High', color: '#E11D48', icon: 'alert-circle-outline' },
  { key: 'medium', label: 'Medium', color: '#D97706', icon: 'time-outline' },
  { key: 'low', label: 'Low', color: '#0284C7', icon: 'arrow-down-circle-outline' },
];

const CATEGORY_OPTIONS: { key: TodoCategory; label: string; icon: string }[] = [
  { key: 'financial', label: 'Financial', icon: 'wallet-outline' },
  { key: 'bills', label: 'Bills', icon: 'flash-outline' },
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'general', label: 'General', icon: 'checkmark-done-circle-outline' },
];

type FilterType = 'all' | 'pending' | 'completed';

export function TodoTool() {
  const theme = useTheme();
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<TodoCategory>('general');
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    let ignore = false;
    getTodos().then((data) => {
      if (!ignore) setTodos(data);
    }).catch(() => {});
    return () => {
      ignore = true;
    };
  }, []);

  const refreshList = async () => {
    const data = await getTodos();
    setTodos(data);
  };

  const handleAddTodo = async () => {
    if (!title.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      completed: false,
      priority,
      category,
      createdAt: new Date().toISOString(),
    };
    await saveTodo(newTodo);
    setTitle('');
    await refreshList();
  };

  const handleToggle = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await toggleTodo(id);
    await refreshList();
  };

  const handleDelete = async (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await deleteTodo(id);
    await refreshList();
  };

  const handleClearDone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearCompletedTodos();
    await refreshList();
  };

  const completedCount = todos.filter((t) => t.completed).length;
  const pendingCount = todos.length - completedCount;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const filteredTodos = todos.filter((t) => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Progress & Header Card */}
      <View style={[styles.progressCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTextGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="checkbox-outline" size={16} color={theme.accent} />
              <ThemedText type="smallBold">Task Overview</ThemedText>
            </View>
            <ThemedText type="caption" themeColor="textSecondary">
              {completedCount} of {todos.length} completed ({progressPercent}%)
            </ThemedText>
          </View>

          {completedCount > 0 && (
            <Pressable
              onPress={handleClearDone}
              accessibilityRole="button"
              accessibilityLabel="Clear completed tasks"
              style={({ pressed }) => [styles.clearBtn, { backgroundColor: theme.card }, pressed && styles.pressed]}>
              <ThemedText type="caption" style={{ color: theme.danger, fontWeight: '700' }}>Clear done</ThemedText>
            </Pressable>
          )}
        </View>

        {/* Progress Track */}
        <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: theme.success,
              },
            ]}
          />
        </View>
      </View>

      {/* Compact Task Creation Card */}
      <View style={[styles.createCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.inputRow}>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Add a task or checklist item..."
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Task title"
            returnKeyType="done"
            onSubmitEditing={handleAddTodo}
            style={[styles.input, { color: theme.text, backgroundColor: theme.cardMuted, borderColor: theme.border }]}
          />
          <Pressable
            onPress={handleAddTodo}
            disabled={!title.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add task"
            style={({ pressed }) => [
              styles.addBtn,
              { backgroundColor: title.trim() ? theme.accentFill : theme.border },
              pressed && styles.pressed,
            ]}>
            <Ionicons name="add" size={20} color={title.trim() ? '#FFFFFF' : theme.textSecondary} />
          </Pressable>
        </View>

        {/* Priorities & Categories in 1 Horizontal Scroll Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {PRIORITY_OPTIONS.map((p) => {
            const selected = priority === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPriority(p.key);
                }}
                accessibilityRole="button"
                style={[
                  styles.pill,
                  {
                    backgroundColor: selected ? `${p.color}22` : theme.cardMuted,
                    borderColor: selected ? p.color : theme.border,
                  },
                ]}>
                <Ionicons name={p.icon as any} size={12} color={selected ? p.color : theme.textSecondary} />
                <ThemedText type="caption" style={{ color: selected ? p.color : theme.textSecondary, fontWeight: '700', fontSize: 10 }}>
                  {p.label}
                </ThemedText>
              </Pressable>
            );
          })}
          <View style={[styles.chipDivider, { backgroundColor: theme.border }]} />
          {CATEGORY_OPTIONS.map((c) => {
            const selected = category === c.key;
            return (
              <Pressable
                key={c.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(c.key);
                }}
                accessibilityRole="button"
                style={[
                  styles.pill,
                  {
                    backgroundColor: selected ? theme.accentFill : theme.cardMuted,
                    borderColor: selected ? theme.accentFill : theme.border,
                  },
                ]}>
                <Ionicons name={c.icon as any} size={12} color={selected ? '#FFFFFF' : theme.textSecondary} />
                <ThemedText type="caption" style={{ color: selected ? '#FFFFFF' : theme.textSecondary, fontWeight: '700', fontSize: 10 }}>
                  {c.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Segmented Filter Control */}
      <View style={[styles.filterBar, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        {(['all', 'pending', 'completed'] as FilterType[]).map((f) => {
          const selected = filter === f;
          const count = f === 'all' ? todos.length : f === 'pending' ? pendingCount : completedCount;
          return (
            <Pressable
              key={f}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
              accessibilityRole="button"
              style={[
                styles.filterTab,
                selected && { backgroundColor: theme.card, borderColor: theme.border, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 2, elevation: 1 },
              ]}>
              <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '800', textTransform: 'uppercase', fontSize: 10 }}>
                {f} ({count})
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* List Feed */}
      {filteredTodos.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-circle-outline" size={38} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.text }}>
            {todos.length === 0 ? 'No tasks yet' : 'No items match filter'}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {todos.length === 0 ? 'Add financial reminders or personal checklist items above.' : 'Switch filter tab to view other tasks.'}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredTodos.map((item) => {
            const pObj = PRIORITY_OPTIONS.find((p) => p.key === item.priority) || PRIORITY_OPTIONS[1];
            const cObj = CATEGORY_OPTIONS.find((c) => c.key === item.category) || CATEGORY_OPTIONS[3];

            return (
              <View
                key={item.id}
                style={[
                  styles.todoRow,
                  {
                    backgroundColor: item.completed ? theme.cardMuted : theme.card,
                    borderColor: theme.border,
                    opacity: item.completed ? 0.72 : 1,
                  },
                ]}>
                <Pressable
                  onPress={() => handleToggle(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}
                  hitSlop={8}
                  style={styles.checkBtn}>
                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={item.completed ? theme.success : theme.textSecondary}
                  />
                </Pressable>

                <View style={styles.todoCopy}>
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.todoTitle,
                      item.completed && { textDecorationLine: 'line-through', color: theme.textSecondary },
                    ]}>
                    {item.title}
                  </ThemedText>
                  <View style={styles.badgeGroup}>
                    <View style={[styles.badge, { backgroundColor: `${pObj.color}1E` }]}>
                      <Text style={[styles.badgeText, { color: pObj.color }]}>{pObj.label}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: theme.cardMuted }]}>
                      <Ionicons name={cObj.icon as any} size={10} color={theme.textSecondary} />
                      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{cObj.label}</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  onPress={() => handleDelete(item.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete task"
                  hitSlop={8}
                  style={styles.deleteBtn}>
                  <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  progressCard: {
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTextGroup: {
    gap: 2,
  },
  clearBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  progressTrack: {
    height: 6,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  createCard: {
    padding: Spacing.two,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 42,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 13.5,
  },
  addBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chipDivider: {
    width: StyleSheet.hairlineWidth,
    height: 20,
    marginHorizontal: 2,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  filterTab: {
    flex: 1,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: Spacing.one,
  },
  list: {
    gap: Spacing.two,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  checkBtn: {
    padding: 2,
  },
  todoCopy: {
    flex: 1,
    gap: 4,
  },
  todoTitle: {
    fontSize: 14,
  },
  badgeGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
