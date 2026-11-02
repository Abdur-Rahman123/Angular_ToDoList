import { Injectable } from '@angular/core';
import { Todo, isTodo } from '../models/todo.model';

const STORAGE_KEY = 'todos.v1';

/**
 * Thin wrapper around localStorage so the rest of the app
 * never touches the Web Storage API directly (easy to mock in tests).
 */
@Injectable({ providedIn: 'root' })
export class TodoStorageService {
  load(): Todo[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(isTodo);
    } catch {
      // Corrupted storage should never crash the app.
      return [];
    }
  }

  save(todos: Todo[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      // Storage full / unavailable (e.g. private mode): fail silently.
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
}
