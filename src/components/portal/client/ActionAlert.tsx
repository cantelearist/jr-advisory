'use client';

import type { Todo, Invoice } from '@/lib/database.types';
import './dashboard.css';

interface ActionAlertProps {
  urgentTodos: Todo[];
  overdueInvoices: Invoice[];
}

export default function ActionAlert({ urgentTodos, overdueInvoices }: ActionAlertProps) {
  if (urgentTodos.length === 0 && overdueInvoices.length === 0) return null;

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  return (
    <section className="dash__alert" style={{ animationDelay: '0.5s' }}>
      <div className="dash__alert-inner">
        <span className="dash__alert-icon">⚠</span>
        <div className="dash__alert-content">
          <span className="dash__alert-title">Action Required</span>
          {urgentTodos.map(t => (
            <p key={t.id} className="dash__alert-item">
              {t.title}
              {t.due_date
                ? ` — due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : ''}
            </p>
          ))}
          {overdueInvoices.map(inv => (
            <p key={inv.id} className="dash__alert-item">
              Invoice {inv.invoice_number} overdue — {formatCurrency(Number(inv.amount))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
