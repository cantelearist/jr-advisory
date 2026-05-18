'use client';

import { useState, useEffect, useCallback } from 'react';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { fetchAllClients, fetchAllEngagements, fetchAllInvoices } from '@/lib/data';
import { resetDatabase } from '@/lib/testData';
import type { Client, Engagement, Invoice } from '@/lib/database.types';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const PHASE_LABELS: Record<string, string> = {
  '1': 'I — Confidential Consultation',
  '2': 'II — Independent Assessment',
  '3': 'III — Scope & Vendor Curation',
  '4': 'IV — Oversight & Clearance',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  pending: '#c9a96e',
  completed: 'rgba(255,255,255,0.4)',
  archived: 'rgba(255,255,255,0.2)',
};

type Tab = 'overview' | 'clients' | 'engagements' | 'invoices' | 'settings';

export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);

  const loadData = useCallback(async () => {
    const [c, e, i] = await Promise.all([
      fetchAllClients(),
      fetchAllEngagements(),
      fetchAllInvoices(),
    ]);
    setClients(c);
    setEngagements(e);
    setInvoices(i);
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  const handleReset = () => {
    if (confirm('Reset all test data to seed state? This cannot be undone.')) {
      resetDatabase();
      loadData();
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'clients', label: 'CLIENTS' },
    { id: 'engagements', label: 'ENGAGEMENTS' },
    { id: 'invoices', label: 'INVOICES' },
    { id: 'settings', label: 'SETTINGS' },
  ];

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav active="admin" />

      <main className="portal-main" style={{ paddingTop: 100 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease' }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p className="eyebrow" style={{ color: '#c9a96e', marginBottom: 8, letterSpacing: 3 }}>ADMINISTRATION</p>
            <h1 className="display" style={{ fontSize: 42, margin: 0 }}>Firm Dashboard</h1>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16 }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="mono"
                style={{
                  background: tab === t.id ? 'rgba(201,169,110,0.12)' : 'transparent',
                  border: `1px solid ${tab === t.id ? 'rgba(201,169,110,0.3)' : 'transparent'}`,
                  color: tab === t.id ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                  padding: '10px 20px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  letterSpacing: 2,
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* === OVERVIEW TAB === */}
          {tab === 'overview' && (
            <>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
                {[
                  { label: 'ACTIVE CLIENTS', value: String(activeClients), color: '#4ade80' },
                  { label: 'TOTAL CLIENTS', value: String(clients.length), color: 'rgba(255,255,255,0.85)' },
                  { label: 'TOTAL BILLED', value: formatCurrency(totalRevenue), color: 'rgba(255,255,255,0.85)' },
                  { label: 'COLLECTED', value: formatCurrency(paidRevenue), color: '#4ade80' },
                ].map((s, i) => (
                  <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '24px 20px',
                    backdropFilter: 'blur(12px)',
                  }}>
                    <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 10 }}>{s.label}</p>
                    <p className="display" style={{ fontSize: 28, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Pipeline */}
              <div style={{ marginBottom: 48 }}>
                <h2 className="display" style={{ fontSize: 24, marginBottom: 24 }}>Pipeline</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                  {(['1', '2', '3', '4'] as const).map(phase => {
                    const phaseEngs = engagements.filter(e => e.phase === phase);
                    return (
                      <div key={phase} style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10,
                        padding: 20,
                      }}>
                        <p className="mono" style={{ color: '#c9a96e', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                          PHASE {PHASE_LABELS[phase]}
                        </p>
                        {phaseEngs.length === 0 ? (
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' }}>No engagements</p>
                        ) : (
                          phaseEngs.map(eng => {
                            const client = clients.find(c => c.id === eng.client_id);
                            return (
                              <div key={eng.id} style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8,
                                padding: '12px 14px',
                                marginBottom: 8,
                              }}>
                                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0, fontWeight: 500 }}>
                                  {client?.name || 'Unknown'}
                                </p>
                                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>
                                  {eng.type}
                                </p>
                                {eng.next_milestone && (
                                  <p style={{ fontSize: 11, color: '#c9a96e', margin: '4px 0 0', opacity: 0.7 }}>
                                    {eng.next_milestone}
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* === CLIENTS TAB === */}
          {tab === 'clients' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>All Clients</h2>
                <button className="btn" style={{
                  background: 'rgba(201,169,110,0.12)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  color: '#c9a96e',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: 1.5,
                }}>
                  + INVITE CLIENT
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clients.map(client => {
                  const eng = engagements.find(e => e.client_id === client.id);
                  return (
                    <div key={client.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: '20px 24px',
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1fr auto',
                      alignItems: 'center',
                      gap: 20,
                    }}>
                      <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                          {client.name}
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                          {client.property}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                          {eng ? eng.type : '—'}
                        </p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
                          {eng ? `Phase ${eng.phase}` : '—'}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                          {client.area}
                        </p>
                      </div>
                      <span className="mono" style={{
                        fontSize: 10,
                        letterSpacing: 1.5,
                        color: STATUS_COLORS[client.status] || 'rgba(255,255,255,0.4)',
                        padding: '6px 14px',
                        borderRadius: 6,
                        background: `${STATUS_COLORS[client.status] || 'rgba(255,255,255,0.4)'}15`,
                        border: `1px solid ${STATUS_COLORS[client.status] || 'rgba(255,255,255,0.4)'}30`,
                      }}>
                        {client.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ENGAGEMENTS TAB === */}
          {tab === 'engagements' && (
            <div>
              <h2 className="display" style={{ fontSize: 24, marginBottom: 32 }}>All Engagements</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {engagements.map(eng => {
                  const client = clients.find(c => c.id === eng.client_id);
                  return (
                    <div key={eng.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 10,
                      padding: '20px 24px',
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1fr 1fr auto',
                      alignItems: 'center',
                      gap: 20,
                    }}>
                      <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                          {client?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                          {eng.property}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{eng.type}</p>
                      </div>
                      <div>
                        <p className="mono" style={{ fontSize: 11, color: '#c9a96e', letterSpacing: 1.5, margin: 0 }}>
                          PHASE {PHASE_LABELS[eng.phase]}
                        </p>
                        {eng.next_milestone && (
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>
                            Next: {eng.next_milestone}
                          </p>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
                        Since {eng.start_date}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === INVOICES TAB === */}
          {tab === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>All Invoices</h2>
                <button className="btn" style={{
                  background: 'rgba(201,169,110,0.12)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  color: '#c9a96e',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: 1.5,
                }}>
                  + CREATE INVOICE
                </button>
              </div>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '20px 16px' }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>TOTAL</p>
                  <p className="display" style={{ fontSize: 24, margin: 0 }}>{formatCurrency(totalRevenue)}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '20px 16px' }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>COLLECTED</p>
                  <p className="display" style={{ fontSize: 24, color: '#4ade80', margin: 0 }}>{formatCurrency(paidRevenue)}</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '20px 16px' }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>OUTSTANDING</p>
                  <p className="display" style={{ fontSize: 24, color: '#c9a96e', margin: 0 }}>{formatCurrency(outstanding)}</p>
                </div>
              </div>

              {/* Invoice list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invoices.map(inv => {
                  const client = clients.find(c => c.id === inv.client_id);
                  const statusColor = {
                    paid: '#4ade80', sent: '#c9a96e', draft: 'rgba(255,255,255,0.4)',
                    overdue: '#ef4444', cancelled: 'rgba(255,255,255,0.2)',
                  }[inv.status] || 'rgba(255,255,255,0.4)';
                  return (
                    <div key={inv.id} style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 8,
                      padding: '16px 20px',
                      display: 'grid',
                      gridTemplateColumns: 'auto 1.5fr 1fr auto auto',
                      alignItems: 'center',
                      gap: 16,
                    }}>
                      <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inv.invoice_number}</span>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{client?.name || '—'}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{inv.description}</p>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Due {inv.due_date}</p>
                      <p className="display" style={{ fontSize: 20, margin: 0 }}>{formatCurrency(Number(inv.amount))}</p>
                      <span className="mono" style={{
                        fontSize: 9, letterSpacing: 1.5, color: statusColor,
                        padding: '5px 12px', borderRadius: 5,
                        background: `${statusColor}15`, border: `1px solid ${statusColor}30`,
                      }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === SETTINGS TAB === */}
          {tab === 'settings' && (
            <div>
              <h2 className="display" style={{ fontSize: 24, marginBottom: 32 }}>Settings</h2>

              {/* Database */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 32,
                marginBottom: 24,
              }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Test Database</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  Reset all data to the initial seed state. This will remove any changes made during testing.
                </p>
                <button onClick={handleReset} className="btn" style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  letterSpacing: 1.5,
                }}>
                  RESET DATABASE
                </button>
              </div>

              {/* Auth status */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 32,
                marginBottom: 24,
              }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Authentication</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Mode:</span>
                  <span style={{ color: '#c9a96e' }}>Demo (localStorage)</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Supabase:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Not configured</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Clients:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{clients.length} test accounts</span>
                </div>
              </div>

              {/* Firm info */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                padding: 32,
              }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Firm Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Name:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>James Roman Advisory</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Phone:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>(310) 430-2500</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Email:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>roman@jamesroman.la</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Domain:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>jamesroman.la</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
