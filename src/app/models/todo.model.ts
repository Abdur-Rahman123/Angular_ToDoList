/** Priority levels for a todo item. */
export type TodoPriority = 'low' | 'medium' | 'high';

/** The three possible filter views. */
export type TodoFilter = 'all' | 'active' | 'completed';

/** Immutable shape of a single todo item. */
export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: number;
  readonly dueDate: string | null;   // ISO date (yyyy-MM-dd) or null
  readonly priority: TodoPriority;
}

/** Runtime guard used when hydrating data from localStorage. */
export function isTodo(value: unknown): value is Todo {
  if (!value || typeof value !== 'object') return false;
  const t = value as Record<string, unknown>;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.completed === 'boolean' &&
    typeof t.createdAt === 'number' &&
    (t.dueDate === null || typeof t.dueDate === 'string') &&
    (t.priority === 'low' || t.priority === 'medium' || t.priority === 'high')
  );
}
