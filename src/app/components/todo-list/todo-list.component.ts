import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Todo, TodoFilter, TodoPriority } from '../../models/todo.model';
import { TodoService, filterTodos } from '../../services/todo.service';

const MAX_TITLE_LENGTH = 200;
const UNDO_TIMEOUT_MS = 5000;

interface DeletedTodo {
  todo: Todo;
  index: number;
}

@Component({
  selector: 'app-todo-list',
  templateUrl: './todo-list.component.html',
  styleUrls: ['./todo-list.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TodoListComponent implements OnInit, OnDestroy {
  todos: Todo[] = [];
  visibleTodos: Todo[] = [];
  filter: TodoFilter = 'all';
  search = '';
  activeCount = 0;
  completedCount = 0;

  readonly priorities: TodoPriority[] = ['low', 'medium', 'high'];
  readonly filters: TodoFilter[] = ['all', 'active', 'completed'];

  /** id of the todo currently being edited inline (null when not editing). */
  editingId: string | null = null;
  editTitle = '';

  /** Undo toast state. */
  deleted: DeletedTodo | null = null;

  todoForm: FormGroup;
  editTitleInvalid = false;

  private readonly destroy$ = new Subject<void>();
  private undoTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private todosService: TodoService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.todoForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(MAX_TITLE_LENGTH)]],
      dueDate: [''],
      priority: ['medium'],
    });
  }

  ngOnInit(): void {
    this.todosService.todos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(todos => {
        this.todos = todos;
        this.activeCount = todos.filter(t => !t.completed).length;
        this.completedCount = todos.length - this.activeCount;
        this.refreshVisible();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.undoTimer) clearTimeout(this.undoTimer);
  }

  // ---------- add ----------
  get formTitle() {
    return this.todoForm.get('title');
  }

  submit(): void {
    if (this.todoForm.invalid) {
      this.todoForm.markAllAsTouched();
      return;
    }
    const { title, dueDate, priority } = this.todoForm.value as {
      title: string;
      dueDate: string;
      priority: TodoPriority;
    };
    this.todosService.add({ title, dueDate: dueDate || null, priority });
    this.todoForm.reset({ title: '', dueDate: '', priority: 'medium' });
  }

  // ---------- filters / search ----------
  setFilter(filter: TodoFilter): void {
    this.filter = filter;
    this.refreshVisible();
    // Local state change outside of an input event binding on a changed
    // reference — ensure the OnPush view re-renders.
    this.cdr.markForCheck();
  }

  onSearch(value: string): void {
    this.search = value;
    this.refreshVisible();
  }

  private refreshVisible(): void {
    this.visibleTodos = filterTodos(this.todos, this.filter, this.search);
  }

  // ---------- per-item actions ----------
  toggle(id: string): void {
    this.todosService.toggle(id);
  }

  remove(todo: Todo): void {
    const index = this.todos.findIndex(t => t.id === todo.id);
    this.todosService.remove(todo.id);
    this.showUndo({ todo, index });
  }

  clearCompleted(): void {
    this.todosService.clearCompleted();
  }

  // ---------- inline edit ----------
  startEdit(todo: Todo): void {
    this.cancelEdit();
    this.editingId = todo.id;
    this.editTitle = todo.title;
    this.cdr.markForCheck();
  }

  onEditInput(value: string): void {
    this.editTitle = value;
  }

  saveEdit(): void {
    if (!this.editingId) return;
    // updateTitle ignores blank/whitespace-only titles, so cancel is safe here.
    this.todosService.updateTitle(this.editingId, this.editTitle);
    this.cancelEdit();
  }

  cancelEdit(): void {
    this.editingId = null;
    this.editTitle = '';
    this.cdr.markForCheck();
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.saveEdit();
    } else if (event.key === 'Escape') {
      this.cancelEdit();
    }
  }

  // ---------- due date / priority ----------
  onDueDateChange(todo: Todo, value: string): void {
    this.todosService.setDueDate(todo.id, value || null);
  }

  onPriorityChange(todo: Todo, value: string): void {
    this.todosService.setPriority(todo.id, value as TodoPriority);
  }

  isOverdue(todo: Todo): boolean {
    if (!todo.dueDate || todo.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(`${todo.dueDate}T00:00:00`).getTime() < today.getTime();
  }

  // ---------- drag & drop ----------
  onDrop(event: CdkDragDrop<Todo[]>): void {
    const moved = this.visibleTodos[event.previousIndex];
    if (!moved) return;

    // Map visible positions back onto indices of the full list so hidden
    // items keep their relative order.
    const fullIds = this.todos.map(t => t.id);
    const visibleIds = this.visibleTodos.map(t => t.id);
    const fromFull = fullIds.indexOf(moved.id);
    const anchorId = visibleIds[event.currentIndex];
    let toFull = anchorId ? fullIds.indexOf(anchorId) : fullIds.length - 1;

    // When moving downwards, insert *after* the anchor item.
    if (toFull > fromFull) {
      const nextVisible = visibleIds.slice(event.currentIndex + 1)[0];
      toFull = nextVisible ? fullIds.indexOf(nextVisible) - 1 : fullIds.length - 1;
    }

    this.todosService.reorder(fromFull, toFull);
  }

  // ---------- undo ----------
  undoDelete(): void {
    if (!this.deleted) return;
    this.todosService.restore(this.deleted.todo, this.deleted.index);
    this.hideUndo();
  }

  private showUndo(deleted: DeletedTodo): void {
    if (this.undoTimer) clearTimeout(this.undoTimer);
    this.deleted = deleted;
    this.undoTimer = setTimeout(() => {
      this.deleted = null;
      this.cdr.markForCheck();
    }, UNDO_TIMEOUT_MS);
  }

  private hideUndo(): void {
    this.deleted = null;
    if (this.undoTimer) {
      clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
  }

  // ---------- trackBy ----------
  trackById(_index: number, todo: Todo): string {
    return todo.id;
  }
}
