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
import type { Client, Engagement, Invoice, Document as DBDocument, AuditLogEntry, Todo } from '@/lib/database.types';
import ClientModal, { type ClientFormData } from '@/components/portal/admin/ClientModal';
import EngagementModal, { type EngagementFormData } from '@/components/portal/admin/EngagementModal';
import InvoiceModal, { type InvoiceFormData } from '@/components/portal/admin/InvoiceModal';
import ContentEditor from '@/components/portal/admin/ContentEditor';
import DocumentUpload from '@/components/portal/admin/DocumentUpload';
import ComposeMessage from '@/components/portal/admin/ComposeMessage';
import type { Message } from '@/lib/database.types';

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

type Tab = 'overview' | 'clients' | 'engagements' | 'documents' | 'messages' | 'invoices' | 'activity' | 'content' | 'settings';

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [clients, setClients] = useState<Client[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<DBDocument[]>([]);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [adminMessages, setAdminMessages] = useState<Message[]>([]);
  const [msgClientFilter, setMsgClientFilter] = useState<string>('all');
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'urgent' | 'high' | 'normal' | 'low'>('normal');
  const [newTodoClientId, setNewTodoClientId] = useState<string>('');
  const [newTodoDue, setNewTodoDue] = useState('');
  const [newTodoVisible, setNewTodoVisible] = useState(false);
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
      setAuditLog(data.auditLog || []);
      setTodos((data.todos || []) as Todo[]);
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

  // Load messages for admin tab
  const loadMessages = useCallback(async (clientId?: string) => {
    try {
      const url = clientId ? `/api/messages/list?client_id=${clientId}` : '/api/messages/list';
      const res = await fetch(url);
      const data = await res.json();
      setAdminMessages(data.messages || []);
    } catch { /* ignore */ }
  }, []);

  // Load messages when switching to messages tab
  useEffect(() => {
    if (tab === 'messages') loadMessages(msgClientFilter !== 'all' ? msgClientFilter : undefined);
  }, [tab, loadMessages, msgClientFilter]);

  /* Todo handlers */
  const addTodo = async () => {
    if (!newTodoTitle.trim()) return;
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTodoTitle.trim(),
          priority: newTodoPriority,
          client_id: newTodoClientId || null,
          due_date: newTodoDue || null,
          visible_to_client: newTodoVisible,
        }),
      });
      const data = await res.json();
      if (data.id) {
        setTodos(prev => [data, ...prev]);
        setNewTodoTitle('');
        setNewTodoPriority('normal');
        setNewTodoClientId('');
        setNewTodoDue('');
        setNewTodoVisible(false);
      }
    } catch { /* skip */ }
  };

  const toggleTodo = async (todo: Todo) => {
    const next = todo.status === 'done' ? 'pending' : 'done';
    try {
      const res = await fetch(`/api/todos/${todo.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json();
      if (data.id) setTodos(prev => prev.map(t => t.id === data.id ? data : t));
    } catch { /* skip */ }
  };

  const deleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch { /* skip */ }
  };

  /* Computed */
  const urgentTodos = todos.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high'));
  const overdueTodos = todos.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const pendingTodos = todos.filter(t => t.status !== 'done');
  const alertCount = urgentTodos.length + overdueTodos.length + overdueInvoices.length;
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
    { id: 'messages', label: 'MESSAGES', icon: '✉' },
    { id: 'invoices', label: 'INVOICES', icon: '▦' },
    { id: 'activity', label: 'ACTIVITY', icon: '▸' },
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
                                onClick={() => client ? router.push(`/portal/admin/clients/${client.id}`) : setEngModal({ open: true, engagement: eng })}
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>
                <div style={{ ...cardStyle, padding: 24, borderRadius: 12 }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>OUTSTANDING</p>
                  <p className="display" style={{ fontSize: 24, color: outstanding > 0 ? '#c9a96e' : '#4ade80', margin: 0 }}>{formatCurrency(outstanding)}</p>
                </div>
                <div style={{ ...cardStyle, padding: 24, borderRadius: 12 }}>
                  <p className="mono" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>ACTIVE ENGAGEMENTS</p>
                  <p className="display" style={{ fontSize: 24, margin: 0 }}>{engagements.length}</p>
                </div>
              </div>

              {/* ── URGENT TASKS ALERT ── */}
              {alertCount > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  padding: '20px 24px',
                  marginBottom: 32,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 16,
                }}>
                  <span style={{ fontSize: 20, color: '#ef4444', lineHeight: 1.4 }}>⚠</span>
                  <div style={{ flex: 1 }}>
                    <p className="mono" style={{ fontSize: 11, color: '#ef4444', letterSpacing: 2, margin: '0 0 10px', fontWeight: 600 }}>
                      {alertCount} ITEM{alertCount > 1 ? 'S' : ''} REQUIRING ATTENTION
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {urgentTodos.map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1,
                            padding: '2px 8px', borderRadius: 3,
                            background: t.priority === 'urgent' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: t.priority === 'urgent' ? '#ef4444' : '#f59e0b',
                          }}>
                            {t.priority.toUpperCase()}
                          </span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{t.title}</span>
                          {t.client_id && (() => { const c = clients.find(cl => cl.id === t.client_id); return c ? <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>— {c.name}</span> : null; })()}
                        </div>
                      ))}
                      {overdueTodos.filter(t => !urgentTodos.includes(t)).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, padding: '2px 8px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>OVERDUE</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{t.title}</span>
                        </div>
                      ))}
                      {overdueInvoices.map(inv => (
                        <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, padding: '2px 8px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>OVERDUE INV</span>
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{inv.invoice_number} — {formatCurrency(Number(inv.amount))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── TO-DO LIST ── */}
              <div style={{ marginBottom: 48 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h2 className="display" style={{ fontSize: 24, margin: 0 }}>To-Do List</h2>
                  <span className="mono" style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: 1.5 }}>
                    {pendingTodos.length} OPEN · {todos.filter(t => t.status === 'done').length} DONE
                  </span>
                </div>

                {/* Add todo form */}
                <div style={{
                  ...cardStyle, padding: '16px 20px', marginBottom: 16, borderRadius: 10,
                  display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
                }}>
                  <input
                    value={newTodoTitle}
                    onChange={e => setNewTodoTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addTodo()}
                    placeholder="Add a task…"
                    style={{
                      flex: 1, minWidth: 200, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '10px 14px', color: '#fff', fontSize: 13, fontFamily: 'Inter, sans-serif',
                      outline: 'none',
                    }}
                  />
                  <select
                    value={newTodoPriority}
                    onChange={e => setNewTodoPriority(e.target.value as 'urgent' | 'high' | 'normal' | 'low')}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, cursor: 'pointer',
                    }}
                  >
                    <option value="urgent">URGENT</option>
                    <option value="high">HIGH</option>
                    <option value="normal">NORMAL</option>
                    <option value="low">LOW</option>
                  </select>
                  <select
                    value={newTodoClientId}
                    onChange={e => setNewTodoClientId(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, cursor: 'pointer', maxWidth: 160,
                    }}
                  >
                    <option value="">NO CLIENT</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <input
                    type="date"
                    value={newTodoDue}
                    onChange={e => setNewTodoDue(e.target.value)}
                    style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 6, padding: '10px 12px', color: 'rgba(255,255,255,0.6)', fontSize: 11,
                      fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
                    }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                    <input type="checkbox" checked={newTodoVisible} onChange={e => setNewTodoVisible(e.target.checked)} />
                    Client-visible
                  </label>
                  <button onClick={addTodo} style={{ ...addBtnStyle, padding: '10px 20px' }}>+ ADD</button>
                </div>

                {/* Todo items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {todos.length === 0 && (
                    <div style={{ ...cardStyle, padding: 40, textAlign: 'center', borderRadius: 10 }}>
                      <p style={{ color: 'rgba(255,255,255,0.2)', margin: 0, fontStyle: 'italic' }}>No tasks yet. Add one above.</p>
                    </div>
                  )}
                  {todos.map(todo => {
                    const isDone = todo.status === 'done';
                    const isOverdue = !isDone && todo.due_date && new Date(todo.due_date) < new Date();
                    const client = clients.find(c => c.id === todo.client_id);
                    const prioColors: Record<string, string> = { urgent: '#ef4444', high: '#f59e0b', normal: '#60a5fa', low: 'rgba(255,255,255,0.25)' };
                    return (
                      <div
                        key={todo.id}
                        style={{
                          display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
                          gap: 12, alignItems: 'center', padding: '12px 16px',
                          background: isDone ? 'rgba(255,255,255,0.01)' : 'rgba(255,255,255,0.02)',
                          borderRadius: 8, border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.04)'}`,
                          opacity: isDone ? 0.45 : 1, transition: 'all 0.2s ease',
                        }}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleTodo(todo)}
                          style={{
                            width: 22, height: 22, borderRadius: 5, cursor: 'pointer',
                            background: isDone ? 'rgba(74,222,128,0.15)' : 'transparent',
                            border: `2px solid ${isDone ? '#4ade80' : prioColors[todo.priority] || '#555'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#4ade80', fontSize: 12, padding: 0,
                          }}
                        >
                          {isDone ? '✓' : ''}
                        </button>

                        {/* Content */}
                        <div>
                          <span style={{
                            fontSize: 14, color: isDone ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
                            textDecoration: isDone ? 'line-through' : 'none',
                          }}>
                            {todo.title}
                          </span>
                          <div style={{ display: 'flex', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                            <span className="mono" style={{
                              fontSize: 9, letterSpacing: 1, padding: '1px 6px', borderRadius: 3,
                              background: `${prioColors[todo.priority]}15`, color: prioColors[todo.priority],
                            }}>
                              {todo.priority.toUpperCase()}
                            </span>
                            {client && (
                              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{client.name}</span>
                            )}
                            {todo.due_date && (
                              <span className="mono" style={{
                                fontSize: 10, color: isOverdue ? '#ef4444' : 'rgba(255,255,255,0.2)',
                              }}>
                                {isOverdue ? '⚠ ' : ''}Due {new Date(todo.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            {todo.visible_to_client && (
                              <span style={{ fontSize: 9, color: '#c9a96e', opacity: 0.6 }}>👁 client-visible</span>
                            )}
                          </div>
                        </div>

                        {/* Date */}
                        <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>
                          {new Date(todo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Delete */}
                        <button
                          onClick={() => deleteTodo(todo.id)}
                          style={{
                            background: 'none', border: 'none', color: 'rgba(255,255,255,0.15)',
                            cursor: 'pointer', fontSize: 14, padding: '4px 8px',
                            transition: 'color 0.2s', borderRadius: 4,
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.15)')}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
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
                      onClick={() => router.push(`/portal/admin/clients/${client.id}`)}
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

          {/* === ENGAGEMENTS — KANBAN BOARD === */}
          {tab === 'engagements' && (() => {
            const KANBAN_PHASES = ['1', '2', '3', '4'] as const;
            const PHASE_COLORS: Record<string, string> = {
              '1': 'rgba(201,169,110,0.5)',
              '2': 'rgba(74,222,128,0.5)',
              '3': 'rgba(96,165,250,0.5)',
              '4': 'rgba(167,139,250,0.5)',
            };
            return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 className="display" style={{ fontSize: 24, margin: 0 }}>Engagement Pipeline</h2>
                <button onClick={() => setEngModal({ open: true, engagement: null })} style={addBtnStyle}>+ NEW ENGAGEMENT</button>
              </div>

              {/* Kanban Board */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16,
                minHeight: 400,
              }}>
                {KANBAN_PHASES.map(phase => {
                  const phaseEngs = engagements.filter(e => e.phase === phase);
                  return (
                    <div
                      key={phase}
                      onDragOver={e => { e.preventDefault(); e.currentTarget.style.background = 'rgba(201,169,110,0.04)'; }}
                      onDragLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                      onDrop={async e => {
                        e.preventDefault();
                        e.currentTarget.style.background = 'transparent';
                        const engId = e.dataTransfer.getData('text/plain');
                        const eng = engagements.find(en => en.id === engId);
                        if (eng && eng.phase !== phase) {
                          await updateEngagement(eng.id, {
                            phase,
                            phase_label: PHASE_LABELS[phase].split(' — ')[1] || PHASE_LABELS[phase],
                          });
                          loadData();
                        }
                      }}
                      style={{
                        borderRadius: 10,
                        border: '1px solid rgba(255,255,255,0.04)',
                        padding: 12,
                        transition: 'background 0.2s ease',
                        display: 'flex', flexDirection: 'column',
                      }}
                    >
                      {/* Column header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        marginBottom: 16, paddingBottom: 12,
                        borderBottom: `2px solid ${PHASE_COLORS[phase]}`,
                      }}>
                        <span className="mono" style={{
                          fontSize: 9, letterSpacing: 2,
                          color: PHASE_COLORS[phase],
                        }}>
                          PHASE {PHASE_LABELS[phase]}
                        </span>
                        <span style={{
                          background: `${PHASE_COLORS[phase]}25`,
                          color: PHASE_COLORS[phase],
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 8px', borderRadius: 10,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                          {phaseEngs.length}
                        </span>
                      </div>

                      {/* Cards */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                        {phaseEngs.length === 0 && (
                          <div style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px dashed rgba(255,255,255,0.06)', borderRadius: 8,
                            minHeight: 100,
                          }}>
                            <p className="mono" style={{ fontSize: 9, color: 'rgba(255,255,255,0.15)', letterSpacing: 1.5 }}>
                              DROP HERE
                            </p>
                          </div>
                        )}
                        {phaseEngs.map(eng => {
                          const client = clients.find(c => c.id === eng.client_id);
                          const engInvoices = invoices.filter(i => i.engagement_id === eng.id);
                          const totalBilled = engInvoices.reduce((s, i) => s + Number(i.amount), 0);
                          return (
                            <div
                              key={eng.id}
                              draggable
                              onDragStart={e => {
                                e.dataTransfer.setData('text/plain', eng.id);
                                e.dataTransfer.effectAllowed = 'move';
                                (e.currentTarget as HTMLElement).style.opacity = '0.4';
                              }}
                              onDragEnd={e => {
                                (e.currentTarget as HTMLElement).style.opacity = '1';
                              }}
                              onClick={() => client ? router.push(`/portal/admin/clients/${client.id}`) : setEngModal({ open: true, engagement: eng })}
                              style={{
                                ...cardStyle,
                                padding: '14px 16px',
                                cursor: 'grab',
                                transition: 'all 0.2s ease',
                                borderLeft: `3px solid ${PHASE_COLORS[phase]}`,
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(201,169,110,0.2)';
                                (e.currentTarget as HTMLElement).style.background = 'rgba(201,169,110,0.03)';
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)';
                                (e.currentTarget as HTMLElement).style.borderLeftColor = PHASE_COLORS[phase];
                                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)';
                              }}
                            >
                              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', margin: 0, fontWeight: 500 }}>
                                {client?.name || 'Unknown'}
                              </p>
                              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', margin: '4px 0 0' }}>
                                {eng.type}
                              </p>
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '2px 0 0' }}>
                                {eng.property}
                              </p>
                              {eng.next_milestone && (
                                <p style={{
                                  fontSize: 11, color: '#c9a96e', margin: '8px 0 0',
                                  opacity: 0.7, fontStyle: 'italic',
                                }}>
                                  ▸ {eng.next_milestone}
                                </p>
                              )}
                              {totalBilled > 0 && (
                                <p className="mono" style={{
                                  fontSize: 10, color: 'rgba(255,255,255,0.3)', margin: '6px 0 0',
                                  letterSpacing: 0.5,
                                }}>
                                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(totalBilled)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })()}

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

          {/* === MESSAGES === */}
          {tab === 'messages' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 300, color: '#c9a96e', margin: 0, letterSpacing: 1 }}>Client Messages</h2>
                <button
                  onClick={() => setShowCompose(true)}
                  style={{ padding: '8px 20px', background: '#c9a96e', border: 'none', borderRadius: 8, color: '#0a0a0a', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  + NEW MESSAGE
                </button>
              </div>

              {/* Client filter pills */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                <button
                  onClick={() => { setMsgClientFilter('all'); loadMessages(); }}
                  style={{
                    padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                    background: msgClientFilter === 'all' ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${msgClientFilter === 'all' ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    color: msgClientFilter === 'all' ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  All
                </button>
                {clients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setMsgClientFilter(c.id); loadMessages(c.id); }}
                    style={{
                      padding: '6px 14px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                      background: msgClientFilter === c.id ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${msgClientFilter === c.id ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
                      color: msgClientFilter === c.id ? '#c9a96e' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {c.name.split(' ').slice(-1)[0]}
                  </button>
                ))}
              </div>

              {/* Messages table */}
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Client', 'Subject', 'From', 'Date', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 12px', fontSize: 11, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {adminMessages.length === 0 && (
                    <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>No messages{msgClientFilter !== 'all' ? ' for this client' : ''}</td></tr>
                  )}
                  {adminMessages.map(msg => {
                    const client = clients.find(c => c.id === msg.client_id);
                    return (
                      <tr key={msg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{client?.name || '—'}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: '#fff', fontWeight: msg.read ? 400 : 600 }}>{msg.subject}</td>
                        <td style={{ padding: '12px', fontSize: 13, color: msg.sender_type === 'firm' ? '#c9a96e' : 'rgba(255,255,255,0.5)' }}>
                          {msg.sender_type === 'firm' ? 'The Firm' : client?.name || 'Client'}
                        </td>
                        <td style={{ padding: '12px', fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                          {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: 4, fontSize: 11,
                            background: msg.read ? 'rgba(255,255,255,0.05)' : 'rgba(201,169,110,0.15)',
                            color: msg.read ? 'rgba(255,255,255,0.3)' : '#c9a96e',
                          }}>
                            {msg.read ? 'Read' : 'Unread'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {showCompose && (
                <ComposeMessage
                  clients={clients}
                  engagements={engagements}
                  preselectedClientId={msgClientFilter !== 'all' ? msgClientFilter : undefined}
                  onClose={() => setShowCompose(false)}
                  onSent={() => { setShowCompose(false); loadMessages(msgClientFilter !== 'all' ? msgClientFilter : undefined); }}
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

          {/* === ACTIVITY / AUDIT LOG === */}
          {tab === 'activity' && (() => {
            const ACTION_LABELS: Record<string, { label: string; color: string; icon: string }> = {
              client_created:    { label: 'Client Created', color: '#4ade80', icon: '◉' },
              client_updated:    { label: 'Client Updated', color: '#60a5fa', icon: '◉' },
              client_deleted:    { label: 'Client Deleted', color: '#ef4444', icon: '◉' },
              engagement_created:{ label: 'Engagement Created', color: '#4ade80', icon: '◈' },
              engagement_updated:{ label: 'Engagement Updated', color: '#60a5fa', icon: '◈' },
              invoice_created:   { label: 'Invoice Created', color: '#4ade80', icon: '▦' },
              invoice_updated:   { label: 'Invoice Updated', color: '#60a5fa', icon: '▦' },
              message_sent:      { label: 'Message Sent', color: '#c9a96e', icon: '✉' },
              document_uploaded: { label: 'Document Uploaded', color: '#a78bfa', icon: '▤' },
              phase_change:      { label: 'Phase Changed', color: '#f59e0b', icon: '▸' },
              login:             { label: 'Login', color: '#60a5fa', icon: '→' },
              seed_reset:        { label: 'Data Reset', color: '#ef4444', icon: '⟲' },
            };
            const actionFilter = 'all';
            const displayLog = auditLog.filter(() => actionFilter === 'all');
            return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h2 className="display" style={{ fontSize: 24, margin: '0 0 4px' }}>Audit Log</h2>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>
                    {auditLog.length} events recorded
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 28 }}>
                {Object.entries(
                  auditLog.reduce((acc, e) => { acc[e.action] = (acc[e.action] || 0) + 1; return acc; }, {} as Record<string, number>)
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 6)
                  .map(([action, count]) => {
                    const info = ACTION_LABELS[action] || { label: action, color: '#888', icon: '•' };
                    return (
                      <div key={action} style={{ ...cardStyle, padding: '14px 16px', textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontFamily: "'Cormorant Garamond', serif", color: info.color }}>{count}</div>
                        <div className="mono" style={{ fontSize: 9, letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                          {info.label.toUpperCase()}
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Log entries */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {displayLog.length === 0 && (
                  <div style={{ ...cardStyle, padding: 40, textAlign: 'center' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', margin: 0 }}>No audit events recorded yet</p>
                  </div>
                )}
                {displayLog.map((entry, i) => {
                  const info = ACTION_LABELS[entry.action] || { label: entry.action, color: '#888', icon: '•' };
                  const meta = entry.metadata as Record<string, string> | null;
                  const ts = new Date(entry.created_at);
                  const timeStr = ts.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
                    ' · ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div
                      key={entry.id || i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr auto',
                        gap: 12,
                        alignItems: 'start',
                        padding: '12px 16px',
                        background: i % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'transparent',
                        borderRadius: 6,
                      }}
                    >
                      <span style={{ color: info.color, fontSize: 14, textAlign: 'center', lineHeight: '20px' }}>
                        {info.icon}
                      </span>
                      <div>
                        <span style={{ fontSize: 13, color: info.color, fontWeight: 500 }}>
                          {info.label}
                        </span>
                        {meta && (
                          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginLeft: 10 }}>
                            {meta.client_name || meta.name || meta.subject || (meta.client_id ? `Client ${String(meta.client_id).slice(0, 8)}…` : '')}
                          </span>
                        )}
                        {entry.entity_id && (
                          <p className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.15)', margin: '2px 0 0' }}>
                            {entry.entity_type}:{entry.entity_id.slice(0, 8)}
                          </p>
                        )}
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })()}

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

              {/* Payments */}
              <div style={{ ...cardStyle, borderRadius: 12, padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Payments</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Processor:</span>
                  <span style={{ color: '#c9a96e' }}>Stripe</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Status:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Pending API keys</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Checkout:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Ready (needs STRIPE_SECRET_KEY env var)</span>
                </div>
              </div>

              {/* Notifications */}
              <div style={{ ...cardStyle, borderRadius: 12, padding: 32, marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: '0 0 16px' }}>Email Notifications</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', fontSize: 14 }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Provider:</span>
                  <span style={{ color: '#c9a96e' }}>Resend</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Status:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>Ready (needs RESEND_API_KEY env var)</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>Triggers:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>New message · Invoice sent · Document upload · Phase change</span>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>From:</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>notifications@jamesroman.la</span>
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
