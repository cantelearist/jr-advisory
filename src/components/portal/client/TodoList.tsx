'use client';

import type { Todo } from '@/lib/database.types';
import './dashboard.css';

const PRIORITY_COLORS: Record<string, string> = {
  urgent: '#ef4444',
  high: '#f59e0b',
  normal: '#60a5fa',
  low: 'rgba(255,255,255,0.25)',
};

interface TodoListProps {
  todos: Todo[];
}

export default function TodoList({ todos }: TodoListProps) {
  if (todos.length === 0) return null;

  return (
    <section className="dash__todos" style={{ animationDelay: '0.55s' }}>
      <div className="dash__section-header">
        <span className="dash__section-label">ACTION ITEMS</span>
        <span className="dash__section-sub">
          {todos.length} item{todos.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="dash__todo-list">
        {todos.map(todo => {
          const isOverdue = todo.due_date && new Date(todo.due_date) < new Date();
          return (
            <div
              key={todo.id}
              className="dash__todo-item"
              style={{ borderLeftColor: PRIORITY_COLORS[todo.priority] }}
            >
              <div className="dash__todo-content">
                <span className="dash__todo-title">{todo.title}</span>
                {todo.description && (
                  <span className="dash__todo-desc">{todo.description}</span>
                )}
              </div>
              <div className="dash__todo-meta">
                {todo.due_date && (
                  <span className={`dash__todo-due${isOverdue ? ' dash__todo-due--overdue' : ''}`}>
                    {isOverdue ? '⚠ ' : ''}
                    Due {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
