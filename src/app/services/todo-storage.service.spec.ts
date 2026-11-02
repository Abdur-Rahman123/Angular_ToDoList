import { TodoStorageService } from './todo-storage.service';

describe('TodoStorageService', () => {
  let storage: TodoStorageService;

  beforeEach(() => {
    localStorage.clear();
    storage = new TodoStorageService();
  });

  it('returns [] for missing or corrupted data', () => {
    expect(storage.load()).toEqual([]);
    localStorage.setItem('todos.v1', 'not json{{{');
    expect(storage.load()).toEqual([]);
    localStorage.setItem('todos.v1', '{"fake":"object"}');
    expect(storage.load()).toEqual([]);
  });

  it('drops invalid entries when loading', () => {
    localStorage.setItem(
      'todos.v1',
      JSON.stringify([
        { id: '1', title: 'ok', completed: false, createdAt: 1, dueDate: null, priority: 'low' },
        { garbage: true },
      ]),
    );
    expect(storage.load().length).toBe(1);
  });

  it('round-trips saved todos', () => {
    const todos = [
      { id: 'x', title: 't', completed: true, createdAt: 5, dueDate: '2030-05-05', priority: 'medium' as const },
    ];
    storage.save(todos);
    expect(storage.load()).toEqual(todos);
    storage.clear();
    expect(storage.load()).toEqual([]);
  });
});
