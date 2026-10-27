export type TodoPriority = 'low' | 'medium' | 'high';
export type TodoCategory = 'financial' | 'bills' | 'personal' | 'general';

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  priority: TodoPriority;
  category: TodoCategory;
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
};
