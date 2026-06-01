'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PortalNav from '@/components/portal/PortalNav';
import dynamic from 'next/dynamic';
import { useAuth } from '@/components/portal/AuthProvider';
import {
  fetchAdminData,
  fetchAllClients, fetchAllEngagements, fetchAllInvoices,
  createClient, updateClient, deleteClient,
  createEngagement, updateEngagement,
  createInvoice, updateInvoice,
} from '@/lib/data';
import type { Client, Engagement, Invoice, Document as DBDocument, AuditLogEntry, Todo, Message, SignatureRequest } from '@/lib/database.types';
import ClientModal, { type ClientFormData } from '@/components/portal/admin/ClientModal';
import EngagementModal, { type EngagementFormData } from '@/components/portal/admin/EngagementModal';
import InvoiceModal, { type InvoiceFormData } from '@/components/portal/admin/InvoiceModal';

import AdminSidebar, { type Tab } from '@/components/portal/admin/AdminSidebar';
import AdminOverview from '@/components/portal/admin/tabs/AdminOverview';
import AdminClients from '@/components/portal/admin/tabs/AdminClients';
import AdminEngagements from '@/components/portal/admin/tabs/AdminEngagements';
import AdminDocuments from '@/components/portal/admin/tabs/AdminDocuments';
import AdminSignatures from '@/components/portal/admin/tabs/AdminSignatures';
import SignatureRequestModal from '@/components/portal/admin/SignatureRequestModal';
import AdminMessages from '@/components/portal/admin/tabs/AdminMessages';
import AdminInvoices from '@/components/portal/admin/tabs/AdminInvoices';
import AdminActivity from '@/components/portal/admin/tabs/AdminActivity';
import AdminContent from '@/components/portal/admin/tabs/AdminContent';
import AdminPages from '@/components/portal/admin/tabs/AdminPages';
import AdminSettings from '@/components/portal/admin/tabs/AdminSettings';
import '@/components/portal/admin/admin.css';

const Scene3D = dynamic(() => import('@/components/portal/Scene3D'), { ssr: false });

export default function AdminPanel() {
  const { isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  /* ── State ── */
  const [tab, setTab] = useState<Tab>('overview');

  /* Read ?tab= from URL on mount */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get('tab');
    const validTabs = ['overview','clients','engagements','documents','signatures','messages','invoices','activity','content','pages','settings'];
    if (urlTab && validTabs.includes(urlTab)) {
      setTab(urlTab as Tab);
    }
  }, []);
  const [clients, setClients] = useState<Client[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [documents, setDocuments] = useState<DBDocument[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [signatures, setSignatures] = useState<(SignatureRequest & { documents?: { name: string; category: string } | null; clients?: { name: string; email: string; property: string } | null })[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<Record<string, string>>({});

  /* Modal state */
  const [clientModal, setClientModal] = useState<{ open: boolean; client: Client | null }>({ open: false, client: null });
  const [engModal, setEngModal] = useState<{ open: boolean; engagement: Engagement | null }>({ open: false, engagement: null });
  const [invModal, setInvModal] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [sigReqModal, setSigReqModal] = useState<{ open: boolean; document: DBDocument | null; client: Client | null }>({ open: false, document: null, client: null });

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !isAdmin) router.replace('/portal/dashboard');
  }, [authLoading, isAdmin, router]);

  /* ── Data loading ── */
  const loadData = useCallback(async () => {
    try {
      const data = await fetchAdminData();
      setClients(data.clients);
      setEngagements(data.engagements);
      setInvoices(data.invoices);
      setDocuments(data.documents || []);
      setMessages(data.messages || []);
      setAuditLog(data.auditLog || []);
      setTodos((data.todos || []) as Todo[]);
      /* Load signature requests */
      try {
        const sigRes = await fetch('/api/signatures/list');
        const sigData = await sigRes.json();
        setSignatures(sigData.signatures || []);
      } catch { /* skip */ }
    } catch {
      const [c, e, i] = await Promise.all([fetchAllClients(), fetchAllEngagements(), fetchAllInvoices()]);
      setClients(c); setEngagements(e); setInvoices(i);
    }
    setLoaded(true);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Computed ── */
  const urgentTodos = todos.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high'));
  const overdueTodos = todos.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date());
  const overdueInvoices = invoices.filter(i => i.status === 'overdue');
  const unreadMessages = messages.filter(m => !m.read).length;
  const pendingDocs = documents.filter(d => d.status === 'pending-review').length;
  const pendingSignatures = signatures.filter(s => s.status === 'pending').length;
  const alertCount = urgentTodos.length + overdueTodos.length + overdueInvoices.length + pendingSignatures;

  /* ── Todo handlers ── */
  const handleAddTodo = async (title: string, priority: string, clientId: string, due: string, visible: boolean) => {
    try {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          priority,
          client_id: clientId || null,
          due_date: due || null,
          visible_to_client: visible,
        }),
      });
      const data = await res.json();
      if (data.id) setTodos(prev => [data, ...prev]);
    } catch { /* skip */ }
  };

  const handleToggleTodo = async (todo: Todo) => {
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

  const handleDeleteTodo = async (id: string) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      setTodos(prev => prev.filter(t => t.id !== id));
    } catch { /* skip */ }
  };

  /* ── Invite handler ── */
  const handleInvite = async (clientId: string) => {
    setInviteStatus(s => ({ ...s, [clientId]: 'sending...' }));
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.success) setInviteStatus(s => ({ ...s, [clientId]: `✓ ${data.password}` }));
      else if (data.message) setInviteStatus(s => ({ ...s, [clientId]: data.message }));
      else setInviteStatus(s => ({ ...s, [clientId]: `Error: ${data.error}` }));
    } catch {
      setInviteStatus(s => ({ ...s, [clientId]: 'Failed' }));
    }
  };

  /* ── CRUD handlers ── */
  const handleSaveClient = async (data: ClientFormData) => {
    if (clientModal.client) await updateClient(clientModal.client.id, data);
    else await createClient(data);
    await loadData();
  };

  const handleDeleteClient = async () => {
    if (clientModal.client) { await deleteClient(clientModal.client.id); await loadData(); }
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

  /* ── Render active tab content ── */
  const renderTab = () => {
    switch (tab) {
      case 'overview':
        return (
          <AdminOverview
            clients={clients}
            engagements={engagements}
            invoices={invoices}
            todos={todos}
            onAddTodo={handleAddTodo}
            onToggleTodo={handleToggleTodo}
            onDeleteTodo={handleDeleteTodo}
            onOpenEngagement={(eng) => setEngModal({ open: true, engagement: eng })}
          />
        );
      case 'clients':
        return (
          <AdminClients
            clients={clients}
            engagements={engagements}
            inviteStatus={inviteStatus}
            onInvite={handleInvite}
            onNewClient={() => setClientModal({ open: true, client: null })}
            onEditClient={(client) => setClientModal({ open: true, client })}
          />
        );
      case 'engagements':
        return (
          <AdminEngagements
            clients={clients}
            engagements={engagements}
            invoices={invoices}
            onNewEngagement={() => setEngModal({ open: true, engagement: null })}
            onOpenEngagement={(eng) => setEngModal({ open: true, engagement: eng })}
            onReload={loadData}
          />
        );
      case 'documents':
        return (
          <AdminDocuments
            clients={clients}
            engagements={engagements}
            documents={documents}
            onReload={loadData}
            onRequestSignature={(doc) => {
              const client = clients.find(c => c.id === doc.client_id);
              if (client) setSigReqModal({ open: true, document: doc, client });
            }}
          />
        );
      case 'signatures':
        return (
          <AdminSignatures
            signatures={signatures}
            clients={clients}
            onReload={loadData}
          />
        );
      case 'messages':
        return <AdminMessages clients={clients} engagements={engagements} />;
      case 'invoices':
        return (
          <AdminInvoices
            clients={clients}
            invoices={invoices}
            onNewInvoice={() => setInvModal({ open: true, invoice: null })}
            onOpenInvoice={(inv) => setInvModal({ open: true, invoice: inv })}
          />
        );
      case 'activity':
        return <AdminActivity auditLog={auditLog} />;
      case 'pages':
        return <AdminPages onEditPage={(pageId) => router.push(`/portal/admin/editor?id=${pageId}`)} />;
      case 'content':
        return <AdminContent />;
      case 'settings':
        return <AdminSettings clients={clients} onReset={handleReset} />;
      default:
        return null;
    }
  };

  return (
    <div className="portal-page">
      <Scene3D variant="dashboard" />
      <PortalNav />

      <div className="admin-shell">
        <AdminSidebar
          activeTab={tab}
          onTabChange={setTab}
          alertCount={alertCount}
          unreadMessages={unreadMessages}
          badges={{
            overview: alertCount,
            messages: unreadMessages,
            invoices: overdueInvoices.length,
            documents: pendingDocs,
            signatures: pendingSignatures,
          }}
        />

        <div className="admin-content" style={{
          opacity: loaded ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}>
          <div className="admin-content__inner">
            {renderTab()}
          </div>
        </div>
      </div>

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
      <SignatureRequestModal
        open={sigReqModal.open}
        document={sigReqModal.document}
        client={sigReqModal.client}
        onClose={() => setSigReqModal({ open: false, document: null, client: null })}
        onSent={loadData}
      />
    </div>
  );
}
