import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { TodoListComponent } from './todo-list.component';
import { TodoService } from '../../services/todo.service';
import { TodoStorageService } from '../../services/todo-storage.service';

describe('TodoListComponent', () => {
  let component: TodoListComponent;
  let fixture: ComponentFixture<TodoListComponent>;
  let service: TodoService;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      declarations: [TodoListComponent],
      imports: [ReactiveFormsModule, DragDropModule, NoopAnimationsModule],
      providers: [TodoService, TodoStorageService],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
    component = fixture.componentInstance;
    service = TestBed.inject(TodoService);
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('adds a todo through the form and updates counts', () => {
    component.todoForm.setValue({ title: 'Buy milk', dueDate: '', priority: 'high' });
    component.submit();

    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].title).toBe('Buy milk');
    expect(service.snapshot[0].priority).toBe('high');
    expect(component.activeCount).toBe(1);
  });

  it('does not add blank todos (validation)', () => {
    component.todoForm.setValue({ title: '   ', dueDate: '', priority: 'medium' });
    component.submit();
    expect(service.snapshot.length).toBe(0);
  });

  it('toggles completion', () => {
    service.add({ title: 'Task' });
    const id = service.snapshot[0].id;
    component.toggle(id);
    expect(service.snapshot[0].completed).toBeTrue();
  });

  it('deletes with undo support', fakeAsync(() => {
    service.add({ title: 'Oops' });
    const removed = service.snapshot[0];
    component.remove(removed);
    expect(service.snapshot.length).toBe(0);

    component.undoDelete();
    tick();
    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].title).toBe('Oops');
  }));

  it('filters by status and search text', () => {
    service.add({ title: 'Alpha task' });
    service.add({ title: 'Beta task' });
    service.toggle(service.snapshot[1].id); // Beta completed

    component.setFilter('active');
    expect(component.visibleTodos.length).toBe(1);
    expect(component.visibleTodos[0].title).toBe('Alpha task');

    component.setFilter('all');
    component.onSearch('beta');
    expect(component.visibleTodos.length).toBe(1);
    expect(component.visibleTodos[0].title).toBe('Beta task');
  });

  it('clears completed items', () => {
    service.add({ title: 'A' });
    service.add({ title: 'B' });
    service.toggle(service.snapshot[1].id);
    component.clearCompleted();
    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].title).toBe('A');
  });

  it('edits inline via Enter key', () => {
    service.add({ title: 'Old' });
    const todo = service.snapshot[0];
    component.startEdit(todo);
    component.onEditInput('New title');
    component.saveEdit();
    expect(service.snapshot[0].title).toBe('New title');
    expect(component.editingId).toBeNull();
  });

  it('persists to localStorage', () => {
    service.add({ title: 'Stored' });
    const raw = localStorage.getItem('todos.v1');
    expect(raw).toContain('Stored');
  });
});
