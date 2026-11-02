import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const THEME_KEY = 'todo.theme';

export type Theme = 'light' | 'dark';

/** Applies a `data-theme` attribute on <html>; CSS variables do the rest. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly subject = new BehaviorSubject<Theme>(this.readStored());

  readonly theme$: Observable<Theme> = this.subject.asObservable();

  constructor() {
    this.apply(this.subject.value);
  }

  get theme(): Theme {
    return this.subject.value;
  }

  toggle(): void {
    const next: Theme = this.theme === 'dark' ? 'light' : 'dark';
    this.subject.next(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* noop */
    }
    this.apply(next);
  }

  private readStored(): Theme {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') return stored;
    } catch {
      /* noop */
    }
    if (typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  }

  private apply(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }
}
