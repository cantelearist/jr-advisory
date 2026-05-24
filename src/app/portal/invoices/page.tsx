'use client';

import { useState, useEffect } from 'react';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/portal/AuthProvider';
import { getMyInvoices } from '@/lib/portal-data';
import type { Invoice } from '@/lib/database.types';

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
  const { supabase, user, loading: authLoading } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (authLoading || !user) return;
    getMyInvoices(supabase).then(data => {
      setInvoices(data);
      setLoaded(true);
    });
  }, [supabase, user, authLoading]);

  const filtered = filter === 'all'
    ? invoices
    : invoices.filter(i => i.status === filter);

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

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav active="invoices" />

      <main className="portal-main" style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px', opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: 48 }}>
            <p className="eyebrow" style={{ color: '#c9a96e', marginBottom: 8, letterSpacing: 3 }}>BILLING</p>
            <h1 className="display" style={{ fontSize: 42, margin: 0 }}>Invoices & Payments</h1>
          </div>

          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 20,
            marginBottom: 48,
          }}>
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
              <div style={{
                textAlign: 'center',
                padding: 64,
                color: 'rgba(255,255,255,0.3)',
                fontStyle: 'italic',
              }}>
                No invoices to display.
              </div>
            )}
            {filtered.map(inv => (
              <div key={inv.id} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10,
                padding: '24px 28px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr auto auto',
                alignItems: 'center',
                gap: 24,
                backdropFilter: 'blur(8px)',
                transition: 'border-color 0.2s ease',
                cursor: 'default',
              }}
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
              For billing inquiries, please use the secure messaging channel or contact the firm directly.
              <br />
              All amounts in USD. Payment terms: Net 30 unless otherwise specified.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
