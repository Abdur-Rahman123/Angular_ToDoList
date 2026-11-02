import { TodoService, filterTodos } from './todo.service';
import { TodoStorageService } from './todo-storage.service';
import { Todo } from '../models/todo.model';

function makeService(): { service: TodoService; storage: TodoStorageService } {
  localStorage.clear();
  const storage = new TodoStorageService();
  return { storage, service: new TodoService(storage) };
}

describe('TodoService', () => {
  it('trims titles and ignores blank input', () => {
    const { service } = makeService();
    service.add({ title: '  hello  ' });
    service.add({ title: '    ' });
    expect(service.snapshot.length).toBe(1);
    expect(service.snapshot[0].title).toBe('hello');
  });

  it('generates unique ids', () => {
    const { service } = makeService();
    service.add({ title: 'a' });
    service.add({ title: 'b' });
    const ids = service.snapshot.map(t => t.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('persists and rehydrates state', () => {
    const { service } = makeService();
    service.add({ title: 'persist me', dueDate: '2030-01-01', priority: 'high' });
    service.toggle(service.snapshot[0].id);

    const second = new TodoService(new TodoStorageService());
    expect(second.snapshot.length).toBe(1);
    expect(second.snapshot[0].completed).toBeTrue();
    expect(second.snapshot[0].dueDate).toBe('2030-01-01');
  });

  it('reorders immutably', () => {
    const { service } = makeService();
    service.add({ title: '1' });
    service.add({ title: '2' });
    service.add({ title: '3' }); // newest first: 3,2,1
    const before = service.snapshot;
    service.reorder(0, 2);
    expect(service.snapshot.map(t => t.title)).toEqual(['2', '1', '3']);
    expect(before.map(t => t.title)).toEqual(['3', '2', '1']); // original untouched
  });

  it('restore puts a deleted todo back at its index', () => {
    const { service } = makeService();
    service.add({ title: 'a' });
    service.add({ title: 'b' });
    const victim: Todo = service.snapshot[1];
    service.remove(victim.id);
    service.restore(victim, 1);
    expect(service.snapshot[1].title).toBe('b');
  });
});

describe('filterTodos', () => {
  const base: Todo[] = [
    { id: '1', title: 'Buy Milk', completed: false, createdAt: 1, dueDate: null, priority: 'low' },
    { id: '2', title: 'Call mom', completed: true, createdAt: 2, dueDate: null, priority: 'high' },
  ];

  it('filters by status', () => {
    expect(filterTodos(base, 'active', '').map(t => t.id)).toEqual(['1']);
    expect(filterTodos(base, 'completed', '').map(t => t.id)).toEqual(['2']);
    expect(filterTodos(base, 'all', '').length).toBe(2);
  });

  it('search is case-insensitive and combined with filters', () => {
    expect(filterTodos(base, 'all', 'milk').map(t => t.id)).toEqual(['1']);
    expect(filterTodos(base, 'completed', 'milk').length).toBe(0);
  });
});
