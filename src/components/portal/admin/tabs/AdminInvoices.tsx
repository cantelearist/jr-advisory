'use client';

import type { Client, Invoice } from '@/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  paid: '#4ade80', sent: '#c9a96e', draft: 'rgba(255,255,255,0.4)',
  overdue: '#ef4444', cancelled: 'rgba(255,255,255,0.2)',
};

interface Props {
  clients: Client[];
  invoices: Invoice[];
  onNewInvoice: () => void;
  onOpenInvoice: (inv: Invoice) => void;
}

export default function AdminInvoices({ clients, invoices, onNewInvoice, onOpenInvoice }: Props) {
  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Invoices</h1>
          <p className="admin-header__subtitle">{invoices.length} invoices · {invoices.filter(i => i.status === 'overdue').length} overdue</p>
        </div>
        <button onClick={onNewInvoice} className="admin-btn admin-btn--primary">+ Create Invoice</button>
      </div>

      {/* Summary KPIs */}
      <div className="admin-kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 28 }}>
        {[
          { label: 'TOTAL', value: fmt(totalRevenue), color: 'rgba(255,255,255,0.85)' },
          { label: 'COLLECTED', value: fmt(paidRevenue), color: 'var(--admin-green)' },
          { label: 'OUTSTANDING', value: fmt(outstanding), color: 'var(--admin-accent)' },
        ].map((s, i) => (
          <div key={i} className="admin-kpi">
            <div className="admin-kpi__label">{s.label}</div>
            <div className="admin-kpi__value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {invoices.map(inv => {
          const client = clients.find(c => c.id === inv.client_id);
          const sc = STATUS_COLORS[inv.status] || 'rgba(255,255,255,0.4)';
          return (
            <div
              key={inv.id}
              className="admin-card admin-card--interactive"
              onClick={() => onOpenInvoice(inv)}
              style={{ padding: '16px 20px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1.5fr 1fr auto auto', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                  {inv.invoice_number}
                </span>
                <div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{client?.name || '—'}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{inv.description}</p>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Due {inv.due_date}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0, color: 'var(--admin-text)' }}>
                  {fmt(Number(inv.amount))}
                </p>
                <span className="admin-badge" style={{
                  background: `${sc}15`, color: sc,
                  border: `1px solid ${sc}30`,
                }}>{inv.status.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
