import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Todo, TodoFilter, TodoPriority } from '../models/todo.model';
import { TodoStorageService } from './todo-storage.service';

export interface NewTodoInput {
  title: string;
  dueDate?: string | null;
  priority?: TodoPriority;
}

/**
 * Single source of truth for todo state.
 * All mutations produce a new immutable array and are persisted automatically.
 */
@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly todosSubject = new BehaviorSubject<Todo[]>([]);

  /** The full list of todos (unfiltered). */
  readonly todos$: Observable<Todo[]> = this.todosSubject.asObservable();

  constructor(private storage: TodoStorageService) {
    this.todosSubject.next(this.storage.load());
  }

  add(input: NewTodoInput): void {
    const title = input.title.trim();
    if (!title) return;

    const todo: Todo = {
      id: this.generateId(),
      title,
      completed: false,
      createdAt: Date.now(),
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? 'medium',
    };
    this.update([todo, ...this.current]);
  }

  toggle(id: string): void {
    this.update(this.current.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }

  remove(id: string): void {
    this.update(this.current.filter(t => t.id !== id));
  }

  updateTitle(id: string, title: string): void {
    const trimmed = title.trim();
    if (!trimmed) return;
    this.update(this.current.map(t => (t.id === id ? { ...t, title: trimmed } : t)));
  }

  setDueDate(id: string, dueDate: string | null): void {
    this.update(this.current.map(t => (t.id === id ? { ...t, dueDate } : t)));
  }

  setPriority(id: string, priority: TodoPriority): void {
    this.update(this.current.map(t => (t.id === id ? { ...t, priority } : t)));
  }

  /** Reorder after a drag-and-drop operation. */
  reorder(fromIndex: number, toIndex: number): void {
    const todos = [...this.current];
    if (fromIndex < 0 || fromIndex >= todos.length || toIndex < 0 || toIndex >= todos.length) return;
    const [moved] = todos.splice(fromIndex, 1);
    todos.splice(toIndex, 0, moved);
    this.update(todos);
  }

  clearCompleted(): number {
    const remaining = this.current.filter(t => !t.completed);
    const removed = this.current.length - remaining.length;
    this.update(remaining);
    return removed;
  }

  /** Restores a previously deleted todo at the end of the list (undo support). */
  restore(todo: Todo, index: number): void {
    const todos = [...this.current];
    todos.splice(Math.min(index, todos.length), 0, todo);
    this.update(todos);
  }

  get snapshot(): Todo[] {
    return this.current;
  }

  private get current(): Todo[] {
    return this.todosSubject.value;
  }

  private update(todos: Todo[]): void {
    this.todosSubject.next(todos);
    this.storage.save(todos);
  }

  private generateId(): string {
    const c = (typeof crypto !== 'undefined' ? crypto : undefined) as
      | (Crypto & { randomUUID?: () => string })
      | undefined;
    if (c && typeof c.randomUUID === 'function') {
      return c.randomUUID();
    }
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

/** Pure helper used by the component to project the visible list. */
export function filterTodos(todos: Todo[], filter: TodoFilter, search: string): Todo[] {
  const q = search.trim().toLowerCase();
  return todos.filter(t => {
    const matchesFilter =
      filter === 'all' || (filter === 'active' && !t.completed) || (filter === 'completed' && t.completed);
    const matchesSearch = !q || t.title.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });
}
