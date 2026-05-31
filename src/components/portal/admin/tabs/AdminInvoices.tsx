'use client';

import { useState, useMemo } from 'react';
import type { Client, Invoice } from '@/lib/database.types';

const STATUS_COLORS: Record<string, string> = {
  paid: '#4ade80', sent: '#c9a96e', draft: 'rgba(255,255,255,0.4)',
  overdue: '#ef4444', cancelled: 'rgba(255,255,255,0.2)',
};

const STATUS_FILTERS = ['all', 'overdue', 'sent', 'paid', 'draft', 'cancelled'] as const;

interface Props {
  clients: Client[];
  invoices: Invoice[];
  onNewInvoice: () => void;
  onOpenInvoice: (inv: Invoice) => void;
}

export default function AdminInvoices({ clients, invoices, onNewInvoice, onOpenInvoice }: Props) {
  const [statusFilter, setStatusFilter] = useState<typeof STATUS_FILTERS[number]>('all');
  const [search, setSearch] = useState('');

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const filtered = useMemo(() => {
    let result = invoices;

    if (statusFilter !== 'all') {
      result = result.filter(i => i.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(i => {
        const client = clients.find(c => c.id === i.client_id);
        return (
          i.invoice_number.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (client?.name.toLowerCase().includes(q) ?? false)
        );
      });
    }

    return result;
  }, [invoices, statusFilter, search, clients]);

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

      {/* Search + Filter */}
      <div className="admin-toolbar">
        <div className="admin-search">
          <span className="admin-search__icon">⌕</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="admin-search__input"
          />
          {search && (
            <button className="admin-search__clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
        <div className="admin-filters">
          {STATUS_FILTERS.map(s => {
            const count = s === 'all' ? invoices.length : invoices.filter(i => i.status === s).length;
            if (s !== 'all' && count === 0) return null;
            return (
              <button
                key={s}
                className={`admin-filter-pill ${statusFilter === s ? 'admin-filter-pill--active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="admin-filter-pill__count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Invoice list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div className="admin-empty">
            {search ? `No invoices matching "${search}"` : 'No invoices in this category'}
          </div>
        ) : filtered.map(inv => {
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
