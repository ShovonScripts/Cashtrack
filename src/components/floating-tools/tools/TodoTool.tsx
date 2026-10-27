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
  { key: 'medium', label: 'Medium', color: '#D97706', icon: 'clock-outline' },
  { key: 'low', label: 'Low', color: '#0284C7', icon: 'arrow-down-circle-outline' },
];

const CATEGORY_OPTIONS: { key: TodoCategory; label: string; icon: string }[] = [
  { key: 'financial', label: 'Financial', icon: 'wallet-outline' },
  { key: 'bills', label: 'Bills', icon: 'flash-outline' },
  { key: 'personal', label: 'Personal', icon: 'person-outline' },
  { key: 'general', label: 'General', icon: 'checkbox-marked-circle-outline' },
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
      {/* Progress & Header Bar */}
      <View style={[styles.progressCard, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
        <View style={styles.progressHeader}>
          <View style={styles.progressTextGroup}>
            <ThemedText type="smallBold">Task Completion</ThemedText>
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

      {/* Task Creation Input Card */}
      <View style={[styles.createCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Add a new task or checklist item..."
          placeholderTextColor={theme.textSecondary}
          accessibilityLabel="Task title"
          style={[styles.input, { color: theme.text, backgroundColor: theme.cardMuted, borderColor: theme.border }]}
        />

        {/* Options Row: Priority & Category Selectors */}
        <View style={styles.optionsRow}>
          {/* Priorities */}
          <View style={styles.optionGroup}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.optionLabel}>PRIORITY</ThemedText>
            <View style={styles.pillsRow}>
              {PRIORITY_OPTIONS.map((p) => {
                const selected = priority === p.key;
                return (
                  <Pressable
                    key={p.key}
                    onPress={() => setPriority(p.key)}
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
            </View>
          </View>

          {/* Categories */}
          <View style={styles.optionGroup}>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.optionLabel}>CATEGORY</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              {CATEGORY_OPTIONS.map((c) => {
                const selected = category === c.key;
                return (
                  <Pressable
                    key={c.key}
                    onPress={() => setCategory(c.key)}
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
        </View>

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
          <Ionicons name="add" size={18} color={title.trim() ? '#FFFFFF' : theme.textSecondary} />
          <ThemedText type="defaultBold" style={{ color: title.trim() ? '#FFFFFF' : theme.textSecondary, fontSize: 13 }}>
            Add Task
          </ThemedText>
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'completed'] as FilterType[]).map((f) => {
          const selected = filter === f;
          const count = f === 'all' ? todos.length : f === 'pending' ? pendingCount : completedCount;
          return (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              accessibilityRole="button"
              style={[
                styles.filterTab,
                {
                  backgroundColor: selected ? theme.card : 'transparent',
                  borderColor: selected ? theme.border : 'transparent',
                },
              ]}>
              <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '800', textTransform: 'uppercase' }}>
                {f} ({count})
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* List Feed */}
      {filteredTodos.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.accent} />
          <ThemedText type="smallBold" style={{ color: theme.text }}>
            {todos.length === 0 ? 'No tasks yet' : 'No items match filter'}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={{ textAlign: 'center' }}>
            {todos.length === 0 ? 'Add financial reminders or personal checklist items above.' : 'Switch filter to view other tasks.'}
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
                    opacity: item.completed ? 0.75 : 1,
                  },
                ]}>
                <Pressable
                  onPress={() => handleToggle(item.id)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: item.completed }}
                  hitSlop={8}
                  style={styles.checkBtn}>
                  <Ionicons
                    name={item.completed ? 'checkbox' : 'square-outline'}
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
    padding: Spacing.three,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  input: {
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  optionsRow: {
    gap: Spacing.two,
  },
  optionGroup: {
    gap: 4,
  },
  optionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 6,
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
  addBtn: {
    height: 42,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 4,
    padding: 2,
  },
  filterTab: {
    flex: 1,
    height: 32,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
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
