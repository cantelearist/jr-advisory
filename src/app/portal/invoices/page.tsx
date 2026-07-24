'use client';

import { useState, useEffect, useMemo } from 'react';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { fetchPortalData } from '@/lib/portal-data';
import LoadingSkeleton from '@/components/portal/client/LoadingSkeleton';
import type { Invoice } from '@/lib/database.types';
import '@/components/portal/client/portal.css';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const STATUS_COLORS: Record<string, string> = {
  paid: '#4ade80',
  sent: '#c9a96e',
  draft: 'rgba(255,255,255,0.4)',
  overdue: '#ef4444',
  cancelled: 'rgba(255,255,255,0.2)',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'PAID',
  sent: 'AWAITING PAYMENT',
  draft: 'DRAFT',
  overdue: 'OVERDUE',
  cancelled: 'CANCELLED',
};

export default function PortalInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [payingId, setPayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalData().then(data => {
      setInvoices(data.invoices);
      setLoaded(true);
    });
  }, []);

  const preFiltered = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return preFiltered;
    const q = searchQuery.toLowerCase();
    return preFiltered.filter(i =>
      i.invoice_number.toLowerCase().includes(q) ||
      i.description.toLowerCase().includes(q) ||
      (i.notes && i.notes.toLowerCase().includes(q))
    );
  }, [preFiltered, searchQuery]);

  const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount), 0);
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return d; }
  };

  const handlePay = async (invoiceId: string) => {
    setPayingId(invoiceId);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Unable to create checkout session');
        setPayingId(null);
      }
    } catch {
      alert('Payment service unavailable');
      setPayingId(null);
    }
  };

  const canPay = (inv: Invoice) => inv.status === 'sent' || inv.status === 'overdue';

  const handleExport = async (invoiceId: string) => {
    setExportingId(invoiceId);
    try {
      // Open the branded HTML invoice in a new tab for print/PDF
      window.open(`/api/export/invoice?id=${invoiceId}`, '_blank');
    } finally {
      setTimeout(() => setExportingId(null), 500);
    }
  };

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav />

      <main className="portal-main" style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <p className="eyebrow" style={{ color: '#c9a96e', marginBottom: 8, letterSpacing: 3 }}>BILLING</p>
            <h1 className="display" style={{ fontSize: 42, margin: 0 }}>Invoices & Payments</h1>
          </div>

          {/* Summary Cards */}
          <div className="inv-summary-grid">
            {[
              { label: 'TOTAL BILLED', value: formatCurrency(totalBilled), color: 'rgba(255,255,255,0.85)' },
              { label: 'PAID', value: formatCurrency(totalPaid), color: '#4ade80' },
              { label: 'OUTSTANDING', value: formatCurrency(outstanding), color: outstanding > 0 ? '#c9a96e' : 'rgba(255,255,255,0.4)' },
            ].map((card, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: '28px 24px',
                backdropFilter: 'blur(12px)',
              }}>
                <p className="mono" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11, letterSpacing: 2, marginBottom: 12 }}>
                  {card.label}
                </p>
                <p className="display" style={{ fontSize: 32, color: card.color, margin: 0 }}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <div className="portal-search" style={{ maxWidth: 360 }}>
              <span className="portal-search__icon">⌕</span>
              <input
                type="text"
                className="portal-search__input"
                placeholder="Search invoices…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="portal-search__clear" onClick={() => setSearchQuery('')}>✕</button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            {['all', 'paid', 'sent', 'draft', 'overdue'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="btn"
                style={{
                  background: filter === f ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${filter === f ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.06)'}`,
                  color: filter === f ? '#c9a96e' : 'rgba(255,255,255,0.5)',
                  padding: '8px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  transition: 'all 0.2s ease',
                }}
              >
                {f === 'all' ? `ALL (${invoices.length})` : `${f.toUpperCase()} (${invoices.filter(i => i.status === f).length})`}
              </button>
            ))}
          </div>

          {/* Invoice List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.length === 0 && (
              <div className="portal-empty" style={{ padding: '48px 20px' }}>
                <div className="portal-empty__icon">⎙</div>
                <h3 className="portal-empty__title">{searchQuery ? 'No matches' : 'No invoices to display'}</h3>
                <p className="portal-empty__sub">{searchQuery ? 'Try a different search term' : 'Invoices will appear here when created'}</p>
              </div>
            )}
            {filtered.map(inv => (
              <div key={inv.id} className="inv-card"
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                {/* Left: Invoice details */}
                <div>
                  <p className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, marginBottom: 6 }}>
                    {inv.invoice_number}
                  </p>
                  <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.4 }}>
                    {inv.description}
                  </p>
                  {inv.notes && (
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0' }}>
                      {inv.notes}
                    </p>
                  )}
                </div>

                {/* Dates */}
                <div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                    Due: {formatDate(inv.due_date)}
                  </p>
                  {inv.paid_date && (
                    <p style={{ fontSize: 13, color: '#4ade80', margin: '4px 0 0', opacity: 0.7 }}>
                      Paid: {formatDate(inv.paid_date)}
                    </p>
                  )}
                </div>

                {/* Amount */}
                <div style={{ textAlign: 'right' }}>
                  <p className="display" style={{
                    fontSize: 24,
                    color: inv.status === 'paid' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.85)',
                    margin: 0,
                  }}>
                    {formatCurrency(Number(inv.amount))}
                  </p>
                </div>

                {/* Status badge */}
                <div style={{
                  background: `${STATUS_COLORS[inv.status]}15`,
                  border: `1px solid ${STATUS_COLORS[inv.status]}30`,
                  borderRadius: 6,
                  padding: '6px 14px',
                  minWidth: 120,
                  textAlign: 'center',
                }}>
                  <span className="mono" style={{
                    fontSize: 10,
                    letterSpacing: 1.5,
                    color: STATUS_COLORS[inv.status],
                  }}>
                    {STATUS_LABELS[inv.status] || inv.status.toUpperCase()}
                  </span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, minWidth: 160, alignItems: 'center' }}>
                  {/* Export/Print */}
                  <button
                    onClick={() => handleExport(inv.id)}
                    disabled={exportingId === inv.id}
                    title="View & Print Invoice"
                    style={{
                      padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    ⎙
                  </button>
                  {/* Pay */}
                  {canPay(inv) ? (
                    <button
                      onClick={() => handlePay(inv.id)}
                      disabled={payingId === inv.id}
                      style={{
                        padding: '10px 24px',
                        background: payingId === inv.id ? 'rgba(201,169,110,0.3)' : '#c9a96e',
                        border: 'none',
                        borderRadius: 8,
                        color: '#0a0a0a',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: payingId === inv.id ? 'wait' : 'pointer',
                        letterSpacing: 1,
                        transition: 'all 0.2s ease',
                        opacity: payingId === inv.id ? 0.6 : 1,
                        flex: 1,
                      }}
                    >
                      {payingId === inv.id ? 'LOADING…' : 'PAY NOW'}
                    </button>
                  ) : inv.status === 'paid' ? (
                    <span style={{
                      fontSize: 11,
                      color: 'rgba(74,222,128,0.5)',
                      letterSpacing: 1,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      ✓ PAID
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div style={{
            marginTop: 48,
            paddingTop: 24,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              Payments processed securely via Stripe. For billing inquiries, please use the secure messaging channel.
              <br />
              All amounts in USD. Payment terms: Net 30 unless otherwise specified.
            </p>
          </div>
        </div>
      </main>

      <style jsx>{`
        .inv-summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 48px;
        }
        .inv-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 10px;
          padding: 24px 28px;
          display: grid;
          grid-template-columns: 1fr 1fr auto auto auto;
          align-items: center;
          gap: 20px;
          backdrop-filter: blur(8px);
          transition: border-color 0.2s ease;
          cursor: default;
        }
        @media (max-width: 768px) {
          .inv-summary-grid {
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .inv-summary-grid > :last-child {
            grid-column: 1 / -1;
          }
          .inv-card {
            grid-template-columns: 1fr auto;
            gap: 12px;
            padding: 20px 16px;
          }
          .inv-card > div:nth-child(2) {
            grid-column: 1 / -1;
          }
          .inv-card > div:nth-child(4) {
            order: -1;
          }
          .inv-card > div:nth-child(5) {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 480px) {
          .inv-summary-grid {
            grid-template-columns: 1fr;
          }
          .inv-summary-grid > :last-child {
            grid-column: auto;
          }
        }
      `}</style>
    </div>
  );
}
