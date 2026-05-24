'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/portal/AuthProvider';
import {
  fetchAllClients, fetchAllEngagements, fetchAllInvoices,
  fetchAdminData,
  createClient, updateClient, deleteClient,
  createEngagement, updateEngagement,
  createInvoice, updateInvoice,
} from '@/lib/data';
import type { Client, Engagement, Invoice, Document as DBDocument } from '@/lib/database.types';
import ClientModal, { type ClientFormData } from '@/components/portal/admin/ClientModal';
import EngagementModal, { type EngagementFormData } from '@/components/portal/admin/EngagementModal';
import InvoiceModal, { type InvoiceFormData } from '@/components/portal/admin/InvoiceModal';
import ContentEditor from '@/components/portal/admin/ContentEditor';
import DocumentUpload from '@/components/portal/admin/DocumentUpload';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

const PHASE_LABELS: Record<string, string> = {
  '1': 'I — Consultation',
  '2': 'II — Assessment',
  '3': 'III — Scope & Vendor',
  '4': 'IV — Oversight',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#4ade80',
  pending: '#c9a96e',
  completed: 'rgba(255,255,255,0.4)',
  archived: 'rgba(255,255,255,0.2)',
};

type Tab = 'overview' | 'clients' | 'engagements' | 'documents' | 'invoices' | 'content' | 'settings';

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<DBDocument[]>([]);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  /* Redirect non-admins */
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/portal/dashboard');
    }
  }, [authLoading, isAdmin, router]);

  const handleInvite = async (clientId: string) => {
    setInviteStatus(s => ({ ...s, [clientId]: 'sending...' }));
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.success) {
        setInviteStatus(s => ({ ...s, [clientId]: `✓ ${data.password}` }));
      } else if (data.message) {
        setInviteStatus(s => ({ ...s, [clientId]: data.message }));
      } else {
        setInviteStatus(s => ({ ...s, [clientId]: `Error: ${data.error}` }));
      }
    } catch {
      setInviteStatus(s => ({ ...s, [clientId]: 'Failed' }));
    }
  };

  /* Modal state */
  const [clientModal, setClientModal] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [engModal, setEngModal] = useState<{ open: boolean; engagement: Engagement | null }>({ open: false, engagement: null });
  const [invModal, setInvModal] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });

  const loadData = useCallback(async () => {
    try {
      // Use admin API route (bypasses RLS)
      const data = await fetchAdminData();
      setClients(data.clients);
      setEngagements(data.engagements);
      setInvoices(data.invoices);
      setDocuments(data.documents || []);
    } catch {
      // Fallback to direct queries
      const [c, e, i] = await Promise.all([
        fetchAllClients(),
        fetchAllEngagements(),
        fetchAllInvoices(),
      ]);
      setClients(c);
      setEngagements(e);
      setInvoices(i);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* Computed */
  const activeClients = clients.filter(c => c.status === 'active').length;
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount), 0);
  const paidRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + Number(i.amount), 0);
  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n);

  /* CRUD handlers */
  const handleSaveClient = async (data: ClientFormData) => {
    if (clientModal.client) {
      await updateClient(clientModal.client.id, data);
    } else {
      await createClient(data);
    }
    await loadData();
  };

  const handleDeleteClient = async () => {
    if (clientModal.client) {
      await deleteClient(clientModal.client.id);
      await loadData();
    }
  };

  const handleSaveEngagement = async (data: EngagementFormData) => {
    if (engModal.engagement) {
      await updateEngagement(engModal.engagement.id, {
        type: data.type,
        phase: data.phase as Engagement['phase'],
        phase_label: data.phase_label,
        next_milestone: data.next_milestone,
        notes: data.notes,
      });
    } else {
      await createEngagement({
        client_id: data.client_id,
        type: data.type,
        property: data.property,
        phase: data.phase,
        phase_label: data.phase_label,
        notes: data.notes,
      });
    }
    await loadData();
  };

  const handleSaveInvoice = async (data: InvoiceFormData) => {
    if (invModal.invoice) {
      await updateInvoice(invModal.invoice.id, {
        status: data.status,
        amount: data.amount,
        description: data.description,
        due_date: data.due_date,
        notes: data.notes,
      });
    } else {
      await createInvoice({
        client_id: data.client_id,
        engagement_id: data.engagement_id,
        invoice_number: data.invoice_number,
        description: data.description,
        amount: data.amount,
        due_date: data.due_date,
        status: data.status,
        notes: data.notes,
      });
    }
    await loadData();
  };

  const handleReset = async () => {
    if (confirm('Reset all test data to seed state? This cannot be undone.')) {
      try {
        await fetch('/api/seed?key=jr-seed-2026', { method: 'POST' });
        await fetch('/api/auth/setup?key=jr-auth-2026', { method: 'POST' });
        loadData();
      } catch {
        alert('Reset failed — check console.');
      }
    }
  };

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'OVERVIEW', icon: '◎' },
    { id: 'clients', label: 'CLIENTS', icon: '◉' },
    { id: 'engagements', label: 'ENGAGEMENTS', icon: '◈' },
    { id: 'documents', label: 'DOCUMENTS', icon: '▤' },
    { id: 'invoices', label: 'INVOICES', icon: '▦' },
    { id: 'content', label: 'CONTENT', icon: '✎' },
    { id: 'settings', label: 'SETTINGS', icon: '⚙' },
  ];

  const cardStyle = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10,
  };

  const addBtnStyle = {
    background: 'rgba(201,169,110,0.12)',
    border: '1px solid rgba(201,169,110,0.3)',
    color: '#c9a96e',
    padding: '10px 24px',
    borderRadius: 6,
    cursor: 'pointer' as const,
    fontSize: 12,
    letterSpacing: 1.5,
    fontFamily: "'JetBrains Mono', monospace",
    textTransform: 'uppercase' as const,
    transition: 'all 0.2s ease',
  };

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav />

      <main className="portal-main" style={{ paddingTop: 100 }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', padding: '0 32px',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.6s ease',
        }}>

          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <p className="eyebrow" style={{ color: '#c9a96e', marginBottom: 8, letterSpacing: 3 }}>ADMINISTRATION</p>
            <h1 className="display" style={{ fontSize: 42, margin: 0 }}>Firm Dashboard</h1>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 40,
            borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 16,
            overflowX: 'auto',
          }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? 'rgba(201,169,110,0.12)' : 'transparent',
                  border: `1px solid ${tab === t.id ? 'rgba(201,169,110,0.3)' : 'transparent'}`,
                  color: tab === t.id ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                  padding: '10px 18px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 2,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ fontSize: 14 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* === OVERVIEW === */}
          {tab === 'overview' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
                {[
                  { label: 'ACTIVE CLIENTS', value: String(activeClients), color: '#4ade80' },
                  { label: 'TOTAL CLIENTS', value: String(clients.length), color: 'rgba(255,255,255,0.85)' },
                  { label: 'TOTAL BILLED', value: formatCurrency(totalRevenue), color: 'rgba(255,255,255,0.85)' },
                  { label: 'COLLECTED', value: formatCurrency(paidRevenue), color: '#4ade80' },
                ].map((s, i) => (
                  <div key={i} style={{
                    ...cardStyle,
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
                      <div key={phase} style={{ ...cardStyle, padding: 20 }}>
                        <p className="mono" style={{ color: '#c9a96e', fontSize: 10, letterSpacing: 2, marginBottom: 16 }}>
                          PHASE {PHASE_LABELS[phase]}
                        </p>
                        {phaseEngs.length === 0 ? (
                          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, fontStyle: 'italic' }}>No engagements</p>
                        ) : (
                          phaseEngs.map(eng => {
                            const client = clients.find(c => c.id === eng.client_id);
                            return (
                              <div
                                key={eng.id}
                                onClick={() => setEngModal({ open: true, engagement: eng })}
                                style={{
                                  background: 'rgba(255,255,255,0.03)',
                                  borderRadius: 8,
                                  padding: '12px 14px',
                                  marginBottom: 8,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease',
                                  border: '1px solid transparent',
                                }}
                                onMouseEnter={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.15)';
                                  (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.04)';
                                }}
                                onMouseLeave={e => {
                                  (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                                }}
                              >
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

              {/* Quick stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ ...cardStyle, padding: 24, borderRadius: 12 }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>OUTSTANDING</p>
                  <p className="display" style={{ fontSize: 24, color: outstanding > 0 ? '#c9a96e' : '#4ade80', margin: 0 }}>{formatCurrency(outstanding)}</p>
                </div>
                <div style={{ ...cardStyle, padding: 24, borderRadius: 12 }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>ACTIVE ENGAGEMENTS</p>
                  <p className="display" style={{ fontSize: 24, margin: 0 }}>{engagements.length}</p>
                </div>
              </div>
            </>
          )}

          {/* === CLIENTS === */}
          {tab === 'clients' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>All Clients</h2>
                <button onClick={() => setClientModal({ open: true, client: null })} style={addBtnStyle}>+ NEW CLIENT</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {clients.map(client => {
                  const eng = engagements.find(e => e.client_id === client.id);
                  return (
                    <div
                      key={client.id}
                      onClick={() => setClientModal({ open: true, client })}
                      style={{
                        ...cardStyle,
                        padding: '20px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1fr auto',
                        alignItems: 'center',
                        gap: 20,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.15)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.03)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                          {client.name}
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                          {client.property}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{eng ? eng.type : '—'}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: '4px 0 0' }}>{eng ? `Phase ${eng.phase}` : '—'}</p>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>{client.area}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        {!client.profile_id && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleInvite(client.id); }}
                            className="mono"
                            style={{
                              fontSize: 9, letterSpacing: 1.2, color: '#c9a96e', padding: '5px 10px',
                              borderRadius: 6, background: 'rgba(201,169,110,0.08)',
                              border: '1px solid rgba(201,169,110,0.2)', cursor: 'pointer',
                              transition: 'all 0.2s', whiteSpace: 'nowrap',
                            }}
                          >
                            {inviteStatus[client.id] || 'CREATE LOGIN'}
                          </button>
                        )}
                        {client.profile_id && (
                          <span className="mono" style={{ fontSize: 9, color: '#4ade80', letterSpacing: 1 }}>
                            HAS LOGIN
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === ENGAGEMENTS === */}
          {tab === 'engagements' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>All Engagements</h2>
                <button onClick={() => setEngModal({ open: true, engagement: null })} style={addBtnStyle}>+ NEW ENGAGEMENT</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {engagements.map(eng => {
                  const client = clients.find(c => c.id === eng.client_id);
                  return (
                    <div
                      key={eng.id}
                      onClick={() => setEngModal({ open: true, engagement: eng })}
                      style={{
                        ...cardStyle,
                        padding: '20px 24px',
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1fr 1fr auto',
                        alignItems: 'center',
                        gap: 20,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.15)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.03)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                          {client?.name || 'Unknown'}
                        </p>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>{eng.property}</p>
                      </div>
                      <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>{eng.type}</p>
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
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Since {eng.start_date}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === DOCUMENTS === */}
          {tab === 'documents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>Document Vault</h2>
                <button onClick={() => setShowDocUpload(true)} style={addBtnStyle}>+ UPLOAD DOCUMENT</button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
                {['nda', 'lab-results', 'proposals', 'clearance', 'invoices', 'reports'].map(cat => {
                  const count = documents.filter(d => d.category === cat).length;
                  const labels: Record<string, string> = { nda: 'NDAs', 'lab-results': 'Lab Results', proposals: 'Proposals', clearance: 'Clearance', invoices: 'Invoices', reports: 'Reports' };
                  return (
                    <div key={cat} style={{ ...cardStyle, padding: 20, textAlign: 'center' }}>
                      <div style={{ fontSize: 28, fontFamily: "'Cormorant Garamond', serif", color: '#c9a96e' }}>{count}</div>
                      <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{labels[cat] || cat}</div>
                    </div>
                  );
                })}
              </div>

              {/* Document list */}
              <div style={{ ...cardStyle, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      {['Document', 'Client', 'Category', 'Status', 'Uploaded', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>No documents yet — upload your first file above</td></tr>
                    ) : documents.map(doc => {
                      const client = clients.find(c => c.id === doc.client_id);
                      const catLabels: Record<string, string> = { nda: 'NDA', 'lab-results': 'Lab Results', proposals: 'Proposal', clearance: 'Clearance', invoices: 'Invoice', reports: 'Report' };
                      const hasFile = !!doc.file_path;
                      return (
                        <tr key={doc.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '14px 20px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                            {hasFile && <span style={{ color: '#4ade80', marginRight: 8, fontSize: 10 }}>●</span>}
                            {doc.name}
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{client?.name || '—'}</td>
                          <td style={{ padding: '14px 20px', fontSize: 11, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>{catLabels[doc.category] || doc.category}</td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 10, letterSpacing: '0.1em', padding: '3px 10px', border: '1px solid rgba(255,255,255,0.08)', color: doc.status === 'final' ? 'rgba(255,255,255,0.4)' : '#c9a96e' }}>{doc.status.toUpperCase()}</span>
                          </td>
                          <td style={{ padding: '14px 20px', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>{new Date(doc.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '14px 20px' }}>
                            {hasFile && (
                              <button
                                onClick={async () => {
                                  const res = await fetch(`/api/documents/download?id=${doc.id}`);
                                  const data = await res.json();
                                  if (data.url) window.open(data.url, '_blank');
                                }}
                                style={{ background: 'none', border: '1px solid rgba(201,169,110,0.2)', color: '#c9a96e', fontSize: 10, padding: '4px 12px', letterSpacing: '0.1em', cursor: 'pointer' }}
                              >
                                DOWNLOAD
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete "${doc.name}"?`)) return;
                                await fetch(`/api/documents/delete?id=${doc.id}`, { method: 'DELETE' });
                                loadData();
                              }}
                              style={{ background: 'none', border: '1px solid rgba(255,50,50,0.15)', color: 'rgba(255,50,50,0.5)', fontSize: 10, padding: '4px 12px', letterSpacing: '0.1em', cursor: 'pointer', marginLeft: 8 }}
                            >
                              DELETE
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {showDocUpload && (
                <DocumentUpload
                  clients={clients}
                  engagements={engagements}
                  onUploadComplete={() => { loadData(); }}
                  onClose={() => setShowDocUpload(false)}
                />
              )}
            </div>
          )}

          {/* === INVOICES === */}
          {tab === 'invoices' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>All Invoices</h2>
                <button onClick={() => setInvModal({ open: true, invoice: null })} style={addBtnStyle}>+ CREATE INVOICE</button>
              </div>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                  { label: 'TOTAL', value: formatCurrency(totalRevenue), color: 'rgba(255,255,255,0.85)' },
                  { label: 'COLLECTED', value: formatCurrency(paidRevenue), color: '#4ade80' },
                  { label: 'OUTSTANDING', value: formatCurrency(outstanding), color: '#c9a96e' },
                ].map((s, i) => (
                  <div key={i} style={{ ...cardStyle, padding: '20px 16px' }}>
                    <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>{s.label}</p>
                    <p className="display" style={{ fontSize: 24, color: s.color, margin: 0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {invoices.map(inv => {
                  const client = clients.find(c => c.id === inv.client_id);
                  const statusColor: Record<string, string> = {
                    paid: '#4ade80', sent: '#c9a96e', draft: 'rgba(255,255,255,0.4)',
                    overdue: '#ef4444', cancelled: 'rgba(255,255,255,0.2)',
                  };
                  const sc = statusColor[inv.status] || 'rgba(255,255,255,0.4)';
                  return (
                    <div
                      key={inv.id}
                      onClick={() => setInvModal({ open: true, invoice: inv })}
                      style={{
                        ...cardStyle,
                        borderRadius: 8,
                        padding: '16px 20px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1.5fr 1fr auto auto',
                        alignItems: 'center',
                        gap: 16,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.15)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                      }}
                    >
                      <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{inv.invoice_number}</span>
                      <div>
                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>{client?.name || '—'}</p>
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '2px 0 0' }}>{inv.description}</p>
                      </div>
                      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: 0 }}>Due {inv.due_date}</p>
                      <p className="display" style={{ fontSize: 20, margin: 0 }}>{formatCurrency(Number(inv.amount))}</p>
                      <span className="mono" style={{
                        fontSize: 9, letterSpacing: 1.5, color: sc,
                        padding: '5px 12px', borderRadius: 5,
                        background: `${sc}15`, border: `1px solid ${sc}30`,
                      }}>
                        {inv.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === CONTENT EDITOR === */}
          {tab === 'content' && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <h2 className="display" style={{ fontSize: 24, margin: '0 0 8px' }}>Site Content</h2>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                  Edit marketing page copy directly. Changes save to localStorage (demo mode) or Supabase.
                </p>
              </div>
              <ContentEditor />
            </div>
          )}

          {/* === SETTINGS === */}
          {tab === 'settings' && (
            <div>
              <h2 className="display" style={{ fontSize: 24, marginBottom: 32 }}>Settings</h2>

              {/* Database */}
              <div style={{ ...cardStyle, borderRadius: 12, padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Test Database</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
                  Reset all data to the initial seed state. This will remove any changes, custom invoices, and content edits.
                </p>
                <button onClick={handleReset} style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  padding: '10px 24px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: 1.5,
                }}>
                  RESET ALL DATA
                </button>
              </div>

              {/* Auth status */}
              <div style={{ ...cardStyle, borderRadius: 12, padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Authentication</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Mode:</span>
                  <span style={{ color: '#4ade80' }}>Supabase (Live)</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Auth:</span>
                  <span style={{ color: '#4ade80' }}>Email / Magic Link ✓</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Clients:</span>
                  <span style={{ color: 'rgba(255,255,255,0.7)' }}>{clients.length} accounts</span>
                </div>
              </div>

              {/* Firm info */}
              <div style={{ ...cardStyle, borderRadius: 12, padding: 32 }}>
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

      {/* CRUD Modals */}
      <ClientModal
        open={clientModal.open}
        onClose={() => setClientModal({ open: false, client: null })}
        onSave={handleSaveClient}
        onDelete={clientModal.client ? handleDeleteClient : undefined}
        client={clientModal.client}
      />
      <EngagementModal
        open={engModal.open}
        onClose={() => setEngModal({ open: false, engagement: null })}
        onSave={handleSaveEngagement}
        engagement={engModal.engagement}
        clients={clients}
      />
      <InvoiceModal
        open={invModal.open}
        onClose={() => setInvModal({ open: false, invoice: null })}
        onSave={handleSaveInvoice}
        invoice={invModal.invoice}
        clients={clients}
        engagements={engagements}
      />
    </div>
  );
}
