import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import AdminOverview from '@/components/portal/admin/tabs/AdminOverview';

describe('AdminOverview', () => {
  it('renders a stable server timestamp placeholder to avoid hydration mismatch', () => {
    const html = renderToString(
      <AdminOverview
        clients={[]}
        engagements={[]}
        invoices={[]}
        todos={[]}
        onAddTodo={vi.fn()}
        onToggleTodo={vi.fn()}
        onDeleteTodo={vi.fn()}
        onOpenEngagement={vi.fn()}
      />,
    );

    expect(html).toContain('Last sync:');
    expect(html).toContain('data-testid="admin-last-sync-time"');
    expect(html).not.toMatch(/Last sync:[\\s\\S]*(AM|PM)/);
  });
});
