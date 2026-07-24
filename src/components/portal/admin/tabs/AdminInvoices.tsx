'use client';

import { useState, useMemo } from 'react';
import type { ChangeOrder, Client, Document as DBDocument, Invoice } from '@/lib/database.types';
import { revisedInvoiceTotal } from '@/lib/change-orders';

const STATUS_COLORS: Record<string, string> = {
  paid: '#4ade80', sent: '#c9a96e', draft: 'rgba(255,255,255,0.4)',
  overdue: '#ef4444', cancelled: 'rgba(255,255,255,0.2)',
};

const STATUS_FILTERS = ['all', 'overdue', 'sent', 'paid', 'draft', 'cancelled'] as const;

interface Props {
  clients: Client[];
  invoices: Invoice[];
  changeOrders: ChangeOrder[];
  documents: DBDocument[];
  onNewInvoice: () => void;
  onNewChangeOrder: () => void;
  onOpenInvoice: (inv: Invoice) => void;
  onUpdateChangeOrder: (changeOrder: ChangeOrder, status: ChangeOrder['status']) => void;
}

export default function AdminInvoices({
  clients,
  invoices,
  changeOrders,
  documents,
  onNewInvoice,
  onNewChangeOrder,
  onOpenInvoice,
  onUpdateChangeOrder,
}: Props) {
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

  const approvedChangeOrders = changeOrders.filter(changeOrder => changeOrder.status === 'approved');
  const totalRevenue = invoices.reduce((s, i) => s + revisedInvoiceTotal(i, approvedChangeOrders), 0);
  const paidRevenue = invoices
    .filter(i => i.status === 'paid')
    .reduce((s, i) => s + revisedInvoiceTotal(i, approvedChangeOrders), 0);
  const outstanding = invoices
    .filter(i => i.status === 'sent' || i.status === 'overdue')
    .reduce((s, i) => s + revisedInvoiceTotal(i, approvedChangeOrders), 0);

  return (
    <>
      <div className="admin-header">
        <div>
          <div className="admin-header__eyebrow">ADMINISTRATION</div>
          <h1 className="admin-header__title">Invoices</h1>
          <p className="admin-header__subtitle">{invoices.length} invoices · {invoices.filter(i => i.status === 'overdue').length} overdue</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onNewChangeOrder} className="admin-btn admin-btn--ghost">+ Change Order</button>
          <button onClick={onNewInvoice} className="admin-btn admin-btn--primary">+ Create Invoice</button>
        </div>
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
          const revisedTotal = revisedInvoiceTotal(inv, approvedChangeOrders);
          const hasApprovedChange = revisedTotal !== Number(inv.amount);
          return (
            <div
              key={inv.id}
              className="admin-card admin-card--interactive"
              onClick={() => onOpenInvoice(inv)}
              style={{ padding: '16px 20px' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1.5fr 1fr auto auto', alignItems: 'center', gap: 16 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--admin-text-muted)' }}>
                  {inv.invoice_number}
                </span>
                <div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{client?.name || '—'}</p>
                  <p style={{ fontSize: 12, color: 'var(--admin-text-muted)', margin: '2px 0 0' }}>{inv.description}</p>
                </div>
                <p style={{ fontSize: 13, color: 'var(--admin-text-muted)', margin: 0 }}>Due {inv.due_date}</p>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0, color: 'var(--admin-text)' }}>
                    {fmt(revisedTotal)}
                  </p>
                  {hasApprovedChange && (
                    <p className="admin-results-count" style={{ margin: '3px 0 0' }}>
                      ORIGINAL {fmt(Number(inv.amount))}
                    </p>
                  )}
                </div>
                <span className="admin-badge" style={{
                  background: `${sc}15`, color: sc,
                  border: `1px solid ${sc}30`,
                }}>{inv.status.toUpperCase()}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="admin-section" style={{ marginTop: 40 }}>
        <div className="admin-section__header">
          <div>
            <h2 className="admin-section__title">Change Orders</h2>
            <p className="admin-header__subtitle">
              Separate amendments preserve the original invoice or contract.
            </p>
          </div>
          <span className="admin-section__count">{changeOrders.length} TOTAL</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {changeOrders.length === 0 ? (
            <div className="admin-empty">No change orders have been created.</div>
          ) : changeOrders.map((changeOrder) => {
            const client = clients.find((item) => item.id === changeOrder.client_id);
            const invoice = invoices.find((item) => item.id === changeOrder.source_invoice_id);
            const document = documents.find((item) => item.id === changeOrder.source_document_id);
            const source = changeOrder.source_type === 'invoice'
              ? invoice?.invoice_number || 'Invoice'
              : document?.name || 'Contract';
            const amount = Number(changeOrder.amount_delta);

            return (
              <div key={changeOrder.id} className="admin-card" style={{ padding: '16px 20px' }}>
                <div className="change-order-row">
                  <div>
                    <div className="admin-results-count" style={{ marginBottom: 5 }}>
                      {changeOrder.change_order_number} · {source}
                    </div>
                    <p style={{ margin: 0, color: 'var(--admin-text)', fontSize: 14 }}>
                      {changeOrder.title}
                    </p>
                    <p style={{ margin: '4px 0 0', color: 'var(--admin-text-muted)', fontSize: 12 }}>
                      {client?.name || '—'} · {changeOrder.description}
                    </p>
                  </div>
                  <div style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: 20,
                    color: amount < 0 ? 'var(--admin-green)' : 'var(--admin-accent)',
                    textAlign: 'right',
                  }}>
                    {amount === 0 ? 'Scope only' : `${amount > 0 ? '+' : '−'}${fmt(Math.abs(amount))}`}
                  </div>
                  <span className={`admin-badge admin-badge--${changeOrder.status === 'approved' ? 'active' : changeOrder.status === 'sent' ? 'pending' : 'completed'}`}>
                    {changeOrder.status}
                  </span>
                  <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                    {changeOrder.status === 'draft' && (
                      <>
                        <button
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          onClick={() => onUpdateChangeOrder(changeOrder, 'sent')}
                        >
                          Issue
                        </button>
                        <button
                          className="admin-btn admin-btn--sm admin-btn--ghost"
                          onClick={() => onUpdateChangeOrder(changeOrder, 'cancelled')}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {changeOrder.status === 'sent' && (
                      <>
                        <button
                          className="admin-btn admin-btn--sm admin-btn--primary"
                          onClick={() => onUpdateChangeOrder(changeOrder, 'approved')}
                        >
                          Record Approved
                        </button>
                        <button
                          className="admin-btn admin-btn--sm admin-btn--ghost"
                          onClick={() => onUpdateChangeOrder(changeOrder, 'declined')}
                        >
                          Decline
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
