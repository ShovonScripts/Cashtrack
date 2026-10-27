import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TodoItem } from '@/types/todo';
import { mutateJsonArray, objectRows, readJsonArray } from '@/storage/json-collection';

export const TODOS_STORAGE_KEY = '@cashtrack_todo_tasks';

const todoRows = objectRows<TodoItem>('todo');

/**
 * Read-only access for screens. A corrupt payload is reported as empty so the
 * UI can still render, but mutators below read strictly and abort instead of
 * overwriting the user's tasks with an empty list.
 */
export async function getTodos(): Promise<TodoItem[]> {
  try {
    return await readJsonArray(AsyncStorage, TODOS_STORAGE_KEY, 'todos', todoRows);
  } catch (error) {
    console.error('[cashtrack] Failed to read todo tasks', error);
    return [];
  }
}

export async function saveTodo(todo: TodoItem): Promise<void> {
  await mutateJsonArray(AsyncStorage, TODOS_STORAGE_KEY, 'todos', todoRows, (todos) => {
    const index = todos.findIndex((t) => t.id === todo.id);
    if (index >= 0) {
      const updated = [...todos];
      updated[index] = todo;
      return updated;
    }
    return [todo, ...todos];
  });
}

export async function toggleTodo(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, TODOS_STORAGE_KEY, 'todos', todoRows, (todos) =>
    todos.map((t) => {
      if (t.id === id) {
        const completed = !t.completed;
        return {
          ...t,
          completed,
          completedAt: completed ? new Date().toISOString() : undefined,
        };
      }
      return t;
    })
  );
}

export async function deleteTodo(id: string): Promise<void> {
  await mutateJsonArray(AsyncStorage, TODOS_STORAGE_KEY, 'todos', todoRows, (todos) =>
    todos.filter((t) => t.id !== id)
  );
}

export async function clearCompletedTodos(): Promise<void> {
  await mutateJsonArray(AsyncStorage, TODOS_STORAGE_KEY, 'todos', todoRows, (todos) =>
    todos.filter((t) => !t.completed)
  );
}

/** Overwrites the todo collection. Used when restoring a full backup. */
export async function replaceTodos(todos: TodoItem[]): Promise<void> {
  await AsyncStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
}

/** Removes every todo task. Used by the full "reset all data" flow. */
export async function clearTodos(): Promise<void> {
  await AsyncStorage.removeItem(TODOS_STORAGE_KEY);
}
