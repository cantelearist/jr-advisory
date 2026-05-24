/* ── Data Layer ── */
/* Unified data access: uses Supabase when configured, falls back to localStorage */

import { getSupabase, isSupabaseConfigured } from './supabase';
import {
  getDatabase,
  getClientDocuments,
  getClientMessages,
  getEngagementTimeline,
} from './testData';
import type {
  Client,
  Engagement,
  Document,
  Message,
  TimelineEvent,
  Invoice,
} from './database.types';
import type {
  Client as TestClient,
  Engagement as TestEngagement,
  DocRecord,
  Message as TestMessage,
  TimelineEvent as TestTimelineEvent,
} from './testData';

/* ── Converters: localStorage types → DB types ── */

function toClient(tc: TestClient): Client {
  return {
    id: tc.id, profile_id: null, name: tc.name, email: tc.email,
    phone: tc.phone, property: tc.property, area: tc.area,
    status: tc.status, notes: null, created_at: tc.createdAt, updated_at: tc.createdAt,
  };
}

function toEngagement(te: TestEngagement): Engagement {
  return {
    id: te.id, client_id: te.clientId, type: te.type,
    phase: String(te.phase) as Engagement['phase'],
    phase_label: te.phaseLabel, start_date: te.startDate,
    next_milestone: te.nextMilestone, property: te.property,
    notes: te.notes, created_at: te.startDate, updated_at: te.startDate,
  };
}

function toDocument(d: DocRecord): Document {
  return {
    id: d.id, client_id: d.clientId, engagement_id: d.engagementId,
    name: d.name, category: d.category, status: d.status,
    file_path: null, file_size: d.size, mime_type: null,
    uploaded_by: null, created_at: d.date, updated_at: d.date,
  };
}

function toMessage(m: TestMessage): Message {
  return {
    id: m.id, client_id: m.clientId, engagement_id: m.engagementId,
    sender_type: m.from, sender_name: m.sender, subject: m.subject,
    body: m.body, read: m.read, encrypted: m.encrypted,
    created_at: m.date,
  };
}

function toTimelineEvent(t: TestTimelineEvent): TimelineEvent {
  return {
    id: t.id, engagement_id: t.engagementId,
    phase: String(t.phase) as TimelineEvent['phase'],
    title: t.title, description: t.description,
    event_type: t.type, event_date: t.date, created_at: t.date,
  };
}

/* ── Queries ── */

export async function fetchClient(clientId: string): Promise<Client | null> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const tc = db.clients.find(c => c.id === clientId);
    return tc ? toClient(tc) : null;
  }
  const { data } = await getSupabase().from('clients').select('*').eq('id', clientId).single();
  return (data as Client) || null;
}

export async function fetchAllClients(): Promise<Client[]> {
  if (!isSupabaseConfigured()) {
    return getDatabase().clients.map(toClient);
  }
  const { data } = await getSupabase().from('clients').select('*').order('created_at', { ascending: false });
  return (data as Client[]) || [];
}

export async function fetchEngagement(clientId: string): Promise<Engagement | null> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const te = db.engagements.find(e => e.clientId === clientId);
    return te ? toEngagement(te) : null;
  }
  const { data } = await getSupabase().from('engagements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single();
  return (data as Engagement) || null;
}

export async function fetchAllEngagements(): Promise<Engagement[]> {
  if (!isSupabaseConfigured()) {
    return getDatabase().engagements.map(toEngagement);
  }
  const { data } = await getSupabase().from('engagements').select('*').order('created_at', { ascending: false });
  return (data as Engagement[]) || [];
}

export async function fetchDocuments(clientId: string): Promise<Document[]> {
  if (!isSupabaseConfigured()) {
    return getClientDocuments(clientId).map(toDocument);
  }
  const { data } = await getSupabase().from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Document[]) || [];
}

export async function fetchMessages(clientId: string): Promise<Message[]> {
  if (!isSupabaseConfigured()) {
    return getClientMessages(clientId).map(toMessage);
  }
  const { data } = await getSupabase().from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Message[]) || [];
}

export async function fetchTimeline(engagementId: string): Promise<TimelineEvent[]> {
  if (!isSupabaseConfigured()) {
    return getEngagementTimeline(engagementId).map(toTimelineEvent);
  }
  const { data } = await getSupabase().from('timeline_events').select('*').eq('engagement_id', engagementId).order('event_date', { ascending: true });
  return (data as TimelineEvent[]) || [];
}

export async function fetchInvoices(clientId: string): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_INVOICES.filter(i => i.client_id === clientId);
  }
  const { data } = await getSupabase().from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
}

export async function fetchAllInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_INVOICES;
  }
  const { data } = await getSupabase().from('invoices').select('*').order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
}

/* ── Mutations ── */

export async function sendMessage(msg: {
  client_id: string;
  engagement_id: string;
  sender_type: 'firm' | 'client';
  sender_name: string;
  subject: string;
  body: string;
}): Promise<Message | null> {
  if (!isSupabaseConfigured()) {
    // Demo: add to localStorage
    const db = getDatabase();
    const newMsg: TestMessage = {
      id: `msg_${Date.now()}`,
      clientId: msg.client_id,
      engagementId: msg.engagement_id,
      from: msg.sender_type,
      sender: msg.sender_name,
      subject: msg.subject,
      body: msg.body,
      date: new Date().toISOString(),
      read: false,
      encrypted: true,
    };
    db.messages.push(newMsg);
    const { saveDatabase } = await import('./testData');
    saveDatabase(db);
    return toMessage(newMsg);
  }
  const { data } = await getSupabase().from('messages').insert(msg as Record<string, unknown>).select().single();
  return (data as Message) || null;
}

export async function markMessageRead(messageId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const msg = db.messages.find(m => m.id === messageId);
    if (msg) {
      msg.read = true;
      const { saveDatabase } = await import('./testData');
      saveDatabase(db);
    }
    return;
  }
  await getSupabase().from('messages').update({ read: true } as Record<string, unknown>).eq('id', messageId);
}

export async function updateEngagementPhase(
  engagementId: string,
  phase: '1' | '2' | '3' | '4',
  phaseLabel: string,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const eng = db.engagements.find(e => e.id === engagementId);
    if (eng) {
      eng.phase = parseInt(phase) as 1 | 2 | 3 | 4;
      eng.phaseLabel = phaseLabel;
      const { saveDatabase } = await import('./testData');
      saveDatabase(db);
    }
    return;
  }
  await getSupabase().from('engagements').update({ phase, phase_label: phaseLabel } as Record<string, unknown>).eq('id', engagementId);
}

/* ── CRUD: Clients ── */

export async function createClient(input: {
  name: string;
  email: string;
  phone?: string;
  property: string;
  area: string;
  status?: Client['status'];
}): Promise<Client> {
  const now = new Date().toISOString();
  const newClient: Client = {
    id: `cli_${Date.now()}`,
    profile_id: null,
    name: input.name,
    email: input.email,
    phone: input.phone || null,
    property: input.property,
    area: input.area,
    status: input.status || 'pending',
    notes: null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const testClient = {
      id: newClient.id,
      name: input.name,
      email: input.email,
      phone: input.phone || '',
      property: input.property,
      area: input.area,
      status: (input.status || 'pending') as 'active' | 'pending' | 'completed',
      createdAt: now,
    };
    db.clients.push(testClient);
    const { saveDatabase } = await import('./testData');
    saveDatabase(db);
    return newClient;
  }
  const { data } = await getSupabase().from('clients').insert(input as Record<string, unknown>).select().single();
  return (data as Client) || newClient;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Pick<Client, 'name' | 'email' | 'phone' | 'property' | 'area' | 'status' | 'notes'>>,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const client = db.clients.find(c => c.id === clientId);
    if (client) {
      if (updates.name !== undefined) client.name = updates.name;
      if (updates.email !== undefined) client.email = updates.email;
      if (updates.phone !== undefined) client.phone = updates.phone || '';
      if (updates.property !== undefined) client.property = updates.property;
      if (updates.area !== undefined) client.area = updates.area;
      if (updates.status !== undefined) client.status = updates.status as 'active' | 'pending' | 'completed';
      const { saveDatabase } = await import('./testData');
      saveDatabase(db);
    }
    return;
  }
  await getSupabase().from('clients').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', clientId);
}

export async function deleteClient(clientId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    db.clients = db.clients.filter(c => c.id !== clientId);
    db.engagements = db.engagements.filter(e => e.clientId !== clientId);
    db.documents = db.documents.filter(d => d.clientId !== clientId);
    db.messages = db.messages.filter(m => m.clientId !== clientId);
    const { saveDatabase } = await import('./testData');
    saveDatabase(db);
    return;
  }
  await getSupabase().from('clients').delete().eq('id', clientId);
}

/* ── CRUD: Engagements ── */

export async function createEngagement(input: {
  client_id: string;
  type: string;
  property: string;
  phase?: string;
  phase_label?: string;
  notes?: string;
}): Promise<Engagement> {
  const now = new Date().toISOString();
  const newEng: Engagement = {
    id: `eng_${Date.now()}`,
    client_id: input.client_id,
    type: input.type,
    phase: (input.phase || '1') as Engagement['phase'],
    phase_label: input.phase_label || 'Confidential Consultation',
    start_date: now.split('T')[0],
    next_milestone: null,
    property: input.property,
    notes: input.notes || null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const { saveDatabase } = await import('./testData');
    db.engagements.push({
      id: newEng.id,
      clientId: input.client_id,
      type: input.type,
      phase: parseInt(input.phase || '1') as 1 | 2 | 3 | 4,
      phaseLabel: newEng.phase_label,
      startDate: newEng.start_date,
      nextMilestone: '',
      property: input.property,
      notes: input.notes || '',
    });
    saveDatabase(db);
    return newEng;
  }
  const { data } = await getSupabase().from('engagements').insert(input as Record<string, unknown>).select().single();
  return (data as Engagement) || newEng;
}

export async function updateEngagement(
  engagementId: string,
  updates: Partial<Pick<Engagement, 'type' | 'phase' | 'phase_label' | 'next_milestone' | 'notes'>>,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const eng = db.engagements.find(e => e.id === engagementId);
    if (eng) {
      if (updates.type !== undefined) eng.type = updates.type;
      if (updates.phase !== undefined) eng.phase = parseInt(updates.phase) as 1 | 2 | 3 | 4;
      if (updates.phase_label !== undefined) eng.phaseLabel = updates.phase_label;
      if (updates.next_milestone !== undefined) eng.nextMilestone = updates.next_milestone || '';
      if (updates.notes !== undefined) eng.notes = updates.notes || '';
      const { saveDatabase } = await import('./testData');
      saveDatabase(db);
    }
    return;
  }
  await getSupabase().from('engagements').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', engagementId);
}

/* ── CRUD: Invoices ── */

export async function createInvoice(input: {
  client_id: string;
  engagement_id: string;
  invoice_number: string;
  description: string;
  amount: number;
  due_date: string;
  status?: Invoice['status'];
  notes?: string;
}): Promise<Invoice> {
  const now = new Date().toISOString();
  const newInv: Invoice = {
    id: `inv_${Date.now()}`,
    client_id: input.client_id,
    engagement_id: input.engagement_id,
    invoice_number: input.invoice_number,
    description: input.description,
    amount: input.amount,
    status: input.status || 'draft',
    due_date: input.due_date,
    paid_date: null,
    pdf_path: null,
    notes: input.notes || null,
    stripe_session_id: null,
    stripe_payment_id: null,
    created_at: now,
    updated_at: now,
  };

  if (!isSupabaseConfigured()) {
    // Demo mode: add to in-memory list (invoices are hardcoded, so store override)
    const key = 'jr_advisory_custom_invoices';
    const existing = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(key) || '[]') : [];
    existing.push(newInv);
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(existing));
    return newInv;
  }
  const { data } = await getSupabase().from('invoices').insert(input as Record<string, unknown>).select().single();
  return (data as Invoice) || newInv;
}

export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Pick<Invoice, 'status' | 'amount' | 'description' | 'due_date' | 'paid_date' | 'notes'>>,
): Promise<void> {
  if (!isSupabaseConfigured()) {
    // Demo mode: update in custom invoices store or demo list
    const key = 'jr_advisory_custom_invoices';
    const existing: Invoice[] = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(key) || '[]') : [];
    const idx = existing.findIndex(i => i.id === invoiceId);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...updates, updated_at: new Date().toISOString() };
      if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(existing));
    }
    return;
  }
  await getSupabase().from('invoices').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', invoiceId);
}

/* ── Demo Invoices ── */
const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv_001', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-001', description: 'Phase I — Confidential Consultation',
    amount: 4500, status: 'paid', due_date: '2026-04-01', paid_date: '2026-03-28',
    pdf_path: null, notes: null, stripe_session_id: null, stripe_payment_id: null, created_at: '2026-03-14', updated_at: '2026-03-28',
  },
  {
    id: 'inv_002', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-002', description: 'Phase II — Independent Assessment',
    amount: 8750, status: 'paid', due_date: '2026-04-15', paid_date: '2026-04-12',
    pdf_path: null, notes: null, stripe_session_id: null, stripe_payment_id: null, created_at: '2026-04-01', updated_at: '2026-04-12',
  },
  {
    id: 'inv_003', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-003', description: 'Phase III — Scope & Vendor Curation',
    amount: 6200, status: 'sent', due_date: '2026-05-30', paid_date: null,
    pdf_path: null, notes: 'Net 30', stripe_session_id: null, stripe_payment_id: null, created_at: '2026-05-01', updated_at: '2026-05-01',
  },
  {
    id: 'inv_004', client_id: 'cli_002', engagement_id: 'eng_002',
    invoice_number: 'JRA-2026-004', description: 'Phase I — Confidential Consultation',
    amount: 4500, status: 'paid', due_date: '2026-03-01', paid_date: '2026-02-25',
    pdf_path: null, notes: null, stripe_session_id: null, stripe_payment_id: null, created_at: '2026-02-01', updated_at: '2026-02-25',
  },
  {
    id: 'inv_005', client_id: 'cli_002', engagement_id: 'eng_002',
    invoice_number: 'JRA-2026-005', description: 'Phase II — Independent Assessment (Asbestos Survey)',
    amount: 12400, status: 'sent', due_date: '2026-05-25', paid_date: null,
    pdf_path: null, notes: 'Multi-building survey', stripe_session_id: null, stripe_payment_id: null, created_at: '2026-04-15', updated_at: '2026-04-15',
  },
  {
    id: 'inv_006', client_id: 'cli_004', engagement_id: 'eng_004',
    invoice_number: 'JRA-2026-006', description: 'Phases I–IV — Full Engagement (Indoor Air Quality)',
    amount: 28500, status: 'paid', due_date: '2026-04-01', paid_date: '2026-04-01',
    pdf_path: null, notes: 'Completed engagement — final invoice', stripe_session_id: null, stripe_payment_id: null, created_at: '2026-04-01', updated_at: '2026-04-01',
  },
];

/* ── Admin Data (server-side, bypasses RLS) ── */

export interface AdminData {
  clients: Client[];
  engagements: Engagement[];
  invoices: Invoice[];
  messages: Message[];
  documents: Document[];
  timeline: TimelineEvent[];
  auditLog: { id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> | null; ip_address: string | null; created_at: string }[];
}

export async function fetchAdminData(): Promise<AdminData> {
  if (!isSupabaseConfigured()) {
    // Fallback to localStorage demo data
    const db = getDatabase();
    return {
      clients: db.clients.map(toClient),
      engagements: db.engagements.map(toEngagement),
      invoices: DEMO_INVOICES,
      messages: db.messages.map(toMessage),
      documents: db.documents.map(toDocument),
      timeline: db.timeline.map(toTimelineEvent),
      auditLog: [],
    };
  }
  // Use server API route (bypasses RLS with service role key)
  try {
    const res = await fetch('/api/admin');
    if (!res.ok) throw new Error(`Admin API: ${res.status}`);
    const data = await res.json();
    return {
      clients: data.clients || [],
      engagements: data.engagements || [],
      invoices: data.invoices || [],
      messages: data.messages || [],
      documents: data.documents || [],
      timeline: data.timeline || [],
      auditLog: data.auditLog || [],
    };
  } catch (e) {
    console.error('fetchAdminData failed, falling back to localStorage', e);
    const db = getDatabase();
    return {
      clients: db.clients.map(toClient),
      engagements: db.engagements.map(toEngagement),
      invoices: DEMO_INVOICES,
      messages: db.messages.map(toMessage),
      documents: db.documents.map(toDocument),
      timeline: db.timeline.map(toTimelineEvent),
      auditLog: [],
    };
  }
}
