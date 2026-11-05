import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Brand, Elevation, FeatureColors, glow, Palette, Radius, Spacing } from '@/constants/theme';
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
  { key: 'high', label: 'High', color: FeatureColors.crimson, icon: 'alert-circle-outline' },
  { key: 'medium', label: 'Medium', color: '#D97706', icon: 'clock-outline' },
  { key: 'low', label: 'Low', color: FeatureColors.sky, icon: 'arrow-down-circle-outline' },
];

const CATEGORY_OPTIONS: { key: TodoCategory; label: string; icon: string }[] = [
  { key: 'financial', label: 'Financial', icon: 'wallet-outline' },
  { key: 'bills', label: 'Bills', icon: 'flash-outline' },
  { key: 'personal', label: 'Personal', icon: 'account-outline' },
  { key: 'general', label: 'General', icon: 'check-all' },
];

type QuickDueDate = 'none' | 'today' | 'tomorrow' | 'next_week';

const DUE_DATE_OPTIONS: { key: QuickDueDate; label: string; icon: string }[] = [
  { key: 'none', label: 'No due date', icon: 'calendar-blank-outline' },
  { key: 'today', label: 'Due Today', icon: 'calendar-today' },
  { key: 'tomorrow', label: 'Due Tomorrow', icon: 'clock-outline' },
  { key: 'next_week', label: 'In 7 Days', icon: 'calendar-week' },
];

function calculateDueDate(quick: QuickDueDate): string | undefined {
  if (quick === 'none') return undefined;
  const target = new Date();
  if (quick === 'today') {
    target.setHours(18, 0, 0, 0);
  } else if (quick === 'tomorrow') {
    target.setDate(target.getDate() + 1);
    target.setHours(18, 0, 0, 0);
  } else if (quick === 'next_week') {
    target.setDate(target.getDate() + 7);
    target.setHours(18, 0, 0, 0);
  }
  return target.toISOString();
}

function getDueDateInfo(dueDateIso?: string): { text: string; isOverdue: boolean; isToday: boolean } | null {
  if (!dueDateIso) return null;
  const due = new Date(dueDateIso);
  if (Number.isNaN(due.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  const diffTime = dueDay.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays < 0) {
    return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isToday: false };
  }
  if (diffDays === 0) {
    return { text: 'Due today', isOverdue: false, isToday: true };
  }
  if (diffDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false, isToday: false };
  }
  return {
    text: `Due ${due.toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
    isOverdue: false,
    isToday: false,
  };
}

type FilterType = 'all' | 'pending' | 'completed';

type TodoToolProps = {
  variant?: 'compact' | 'full';
};

export function TodoTool({ variant = 'compact' }: TodoToolProps) {
  const theme = useTheme();
  const isFull = variant === 'full';
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [category, setCategory] = useState<TodoCategory>('general');
  const [quickDueDate, setQuickDueDate] = useState<QuickDueDate>('none');
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
    const calculatedDue = calculateDueDate(quickDueDate);
    const newTodo: TodoItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      completed: false,
      priority,
      category,
      dueDate: calculatedDue,
      createdAt: new Date().toISOString(),
    };
    await saveTodo(newTodo);
    setTitle('');
    setQuickDueDate('none');
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
      <View style={[
        styles.progressCard,
        isFull ? styles.progressCardFull : { backgroundColor: theme.cardMuted, borderColor: theme.border }
      ]}>
        {isFull && (
          <>
            <View pointerEvents="none" style={styles.heroOrbLarge} />
            <View pointerEvents="none" style={styles.heroOrbSmall} />
          </>
        )}
        <View style={styles.progressHeader}>
          <View style={styles.progressTextGroup}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="checkbox-marked-outline" size={18} color={isFull ? Brand.bright : theme.accent} />
              <ThemedText type="smallBold" style={isFull ? { color: Palette.white, fontSize: 16 } : undefined}>
                Task Overview
              </ThemedText>
            </View>
            <ThemedText type="caption" style={isFull ? { color: 'rgba(255,255,255,0.8)' } : undefined}>
              {completedCount} of {todos.length} completed ({progressPercent}%)
            </ThemedText>
          </View>

          {completedCount > 0 && (
            <Pressable
              onPress={handleClearDone}
              accessibilityRole="button"
              accessibilityLabel="Clear completed tasks"
              style={({ pressed }) => [
                styles.clearBtn,
                { backgroundColor: isFull ? 'rgba(255,255,255,0.18)' : theme.card },
                pressed && styles.pressed,
              ]}>
              <Text style={{ color: isFull ? '#FFD1D1' : theme.danger, fontWeight: '800', fontSize: 11 }}>
                Clear done
              </Text>
            </Pressable>
          )}
        </View>

        {/* Progress Track */}
        <View style={[styles.progressTrack, { backgroundColor: isFull ? 'rgba(255,255,255,0.2)' : theme.border }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: isFull ? FeatureColors.mint : theme.success,
              },
            ]}
          />
        </View>
      </View>

      {/* Task Creation Input Card */}
      <View style={[styles.createCard, isFull && styles.createCardFull, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
          {!isFull && (
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
              <MaterialCommunityIcons name="plus" size={20} color={title.trim() ? Palette.white : theme.textSecondary} />
            </Pressable>
          )}
        </View>

        {isFull ? (
          <View style={styles.fullSectionsContainer}>
            {/* Priority Section */}
            <View style={styles.sectionBlock}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionEyebrow}>
                PRIORITY
              </ThemedText>
              <View style={styles.pillsWrapRow}>
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
                        styles.pillFull,
                        {
                          backgroundColor: selected ? `${p.color}22` : theme.cardMuted,
                          borderColor: selected ? p.color : theme.border,
                        },
                      ]}>
                      <MaterialCommunityIcons name={p.icon as any} size={13} color={selected ? p.color : theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: selected ? p.color : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                        {p.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Category Section */}
            <View style={styles.sectionBlock}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionEyebrow}>
                CATEGORY
              </ThemedText>
              <View style={styles.pillsWrapRow}>
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
                        styles.pillFull,
                        {
                          backgroundColor: selected ? theme.accentFill : theme.cardMuted,
                          borderColor: selected ? theme.accentFill : theme.border,
                        },
                      ]}>
                      <MaterialCommunityIcons name={c.icon as any} size={13} color={selected ? Palette.white : theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: selected ? Palette.white : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                        {c.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Schedule Deadline Section */}
            <View style={styles.sectionBlock}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.sectionEyebrow}>
                SCHEDULE DEADLINE
              </ThemedText>
              <View style={styles.pillsWrapRow}>
                {DUE_DATE_OPTIONS.map((d) => {
                  const selected = quickDueDate === d.key;
                  return (
                    <Pressable
                      key={d.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setQuickDueDate(d.key);
                      }}
                      accessibilityRole="button"
                      style={[
                        styles.pill,
                        styles.pillFull,
                        {
                          backgroundColor: selected ? `${theme.accent}22` : theme.cardMuted,
                          borderColor: selected ? theme.accent : theme.border,
                        },
                      ]}>
                      <MaterialCommunityIcons name={d.icon as any} size={13} color={selected ? theme.accent : theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                        {d.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Full Width Submit Button */}
            <Pressable
              onPress={handleAddTodo}
              disabled={!title.trim()}
              accessibilityRole="button"
              accessibilityLabel="Add task"
              style={({ pressed }) => [
                styles.addBtnFull,
                { backgroundColor: title.trim() ? theme.accentFill : theme.border },
                pressed && styles.pressed,
              ]}>
              <MaterialCommunityIcons name="plus" size={20} color={title.trim() ? Palette.white : theme.textSecondary} />
              <ThemedText type="defaultBold" style={{ color: title.trim() ? Palette.white : theme.textSecondary, fontSize: 14 }}>
                Add Task
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          /* Compact Single Horizontal Scroll Row */
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
                  <MaterialCommunityIcons name={p.icon as any} size={12} color={selected ? p.color : theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: selected ? p.color : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
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
                  <MaterialCommunityIcons name={c.icon as any} size={12} color={selected ? Palette.white : theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: selected ? Palette.white : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                    {c.label}
                  </ThemedText>
                </Pressable>
              );
            })}
            <View style={[styles.chipDivider, { backgroundColor: theme.border }]} />
            {DUE_DATE_OPTIONS.map((d) => {
              const selected = quickDueDate === d.key;
              return (
                <Pressable
                  key={d.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setQuickDueDate(d.key);
                  }}
                  accessibilityRole="button"
                  style={[
                    styles.pill,
                    {
                      backgroundColor: selected ? `${theme.accent}22` : theme.cardMuted,
                      borderColor: selected ? theme.accent : theme.border,
                    },
                  ]}>
                  <MaterialCommunityIcons name={d.icon as any} size={12} color={selected ? theme.accent : theme.textSecondary} />
                  <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '700', fontSize: 11 }}>
                    {d.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
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
                selected && { backgroundColor: theme.card, borderColor: theme.border, ...Elevation.low },
              ]}>
              <ThemedText type="caption" style={{ color: selected ? theme.accent : theme.textSecondary, fontWeight: '800', textTransform: 'uppercase', fontSize: 11 }}>
                {f} ({count})
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {/* List Feed */}
      {filteredTodos.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: theme.cardMuted, borderColor: theme.border }]}>
          <MaterialCommunityIcons name="check-all" size={38} color={theme.accent} />
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
            const dueInfo = getDueDateInfo(item.dueDate);

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
                  accessibilityLabel={item.completed ? 'Mark task incomplete' : 'Mark task complete'}
                  accessibilityState={{ checked: item.completed }}
                  hitSlop={10}
                  style={styles.checkBtn}>
                  <MaterialCommunityIcons
                    name={item.completed ? 'check-circle' : 'checkbox-blank-circle-outline'}
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
                      <MaterialCommunityIcons name={cObj.icon as any} size={10} color={theme.textSecondary} />
                      <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{cObj.label}</Text>
                    </View>
                    {dueInfo && !item.completed && (
                      <View style={[styles.badge, { backgroundColor: dueInfo.isOverdue ? '#E11D481E' : dueInfo.isToday ? '#D977061E' : theme.cardMuted }]}>
                        <MaterialCommunityIcons
                          name={dueInfo.isOverdue ? 'alert-circle-outline' : 'calendar-blank-outline'}
                          size={10}
                          color={dueInfo.isOverdue ? FeatureColors.crimson : dueInfo.isToday ? '#D97706' : theme.textSecondary}
                        />
                        <Text style={[styles.badgeText, { color: dueInfo.isOverdue ? FeatureColors.crimson : dueInfo.isToday ? '#D97706' : theme.textSecondary }]}>
                          {dueInfo.text}
                        </Text>
                      </View>
                    )}
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
  progressCardFull: {
    backgroundColor: Brand.deep,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: glow(Brand.deep),
  },
  heroOrbLarge: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    right: -60,
    top: -70,
    backgroundColor: 'rgba(139, 123, 255, 0.22)',
  },
  heroOrbSmall: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    left: -30,
    bottom: -40,
    backgroundColor: 'rgba(20, 231, 253, 0.2)',
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
  createCardFull: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.three,
    fontSize: 14,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullSectionsContainer: {
    gap: Spacing.two,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  pillsWrapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  addBtnFull: {
    minHeight: 44,
    borderRadius: Radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.one,
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
  pillFull: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    minHeight: 44,
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
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 4,
  },
  pressed: {
    opacity: 0.8,
  },
});
