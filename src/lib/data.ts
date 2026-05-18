/* ── Data Layer ── */
/* Unified data access: uses Supabase when configured, falls back to localStorage */

import { supabase, isSupabaseConfigured } from './supabase';
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
  const { data } = await supabase.from('clients').select('*').eq('id', clientId).single();
  return data;
}

export async function fetchAllClients(): Promise<Client[]> {
  if (!isSupabaseConfigured()) {
    return getDatabase().clients.map(toClient);
  }
  const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function fetchEngagement(clientId: string): Promise<Engagement | null> {
  if (!isSupabaseConfigured()) {
    const db = getDatabase();
    const te = db.engagements.find(e => e.clientId === clientId);
    return te ? toEngagement(te) : null;
  }
  const { data } = await supabase.from('engagements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single();
  return data;
}

export async function fetchAllEngagements(): Promise<Engagement[]> {
  if (!isSupabaseConfigured()) {
    return getDatabase().engagements.map(toEngagement);
  }
  const { data } = await supabase.from('engagements').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function fetchDocuments(clientId: string): Promise<Document[]> {
  if (!isSupabaseConfigured()) {
    return getClientDocuments(clientId).map(toDocument);
  }
  const { data } = await supabase.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return data || [];
}

export async function fetchMessages(clientId: string): Promise<Message[]> {
  if (!isSupabaseConfigured()) {
    return getClientMessages(clientId).map(toMessage);
  }
  const { data } = await supabase.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return data || [];
}

export async function fetchTimeline(engagementId: string): Promise<TimelineEvent[]> {
  if (!isSupabaseConfigured()) {
    return getEngagementTimeline(engagementId).map(toTimelineEvent);
  }
  const { data } = await supabase.from('timeline_events').select('*').eq('engagement_id', engagementId).order('event_date', { ascending: true });
  return data || [];
}

export async function fetchInvoices(clientId: string): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) {
    // No invoices in test data yet — return seed invoices
    return DEMO_INVOICES.filter(i => i.client_id === clientId);
  }
  const { data } = await supabase.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return data || [];
}

export async function fetchAllInvoices(): Promise<Invoice[]> {
  if (!isSupabaseConfigured()) {
    return DEMO_INVOICES;
  }
  const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  return data || [];
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
  const { data } = await supabase.from('messages').insert(msg).select().single();
  return data;
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
  await supabase.from('messages').update({ read: true }).eq('id', messageId);
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
  await supabase.from('engagements').update({ phase, phase_label: phaseLabel }).eq('id', engagementId);
}

/* ── Demo Invoices ── */
const DEMO_INVOICES: Invoice[] = [
  {
    id: 'inv_001', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-001', description: 'Phase I — Confidential Consultation',
    amount: 4500, status: 'paid', due_date: '2026-04-01', paid_date: '2026-03-28',
    pdf_path: null, notes: null, created_at: '2026-03-14', updated_at: '2026-03-28',
  },
  {
    id: 'inv_002', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-002', description: 'Phase II — Independent Assessment',
    amount: 8750, status: 'paid', due_date: '2026-04-15', paid_date: '2026-04-12',
    pdf_path: null, notes: null, created_at: '2026-04-01', updated_at: '2026-04-12',
  },
  {
    id: 'inv_003', client_id: 'cli_001', engagement_id: 'eng_001',
    invoice_number: 'JRA-2026-003', description: 'Phase III — Scope & Vendor Curation',
    amount: 6200, status: 'sent', due_date: '2026-05-30', paid_date: null,
    pdf_path: null, notes: 'Net 30', created_at: '2026-05-01', updated_at: '2026-05-01',
  },
  {
    id: 'inv_004', client_id: 'cli_002', engagement_id: 'eng_002',
    invoice_number: 'JRA-2026-004', description: 'Phase I — Confidential Consultation',
    amount: 4500, status: 'paid', due_date: '2026-03-01', paid_date: '2026-02-25',
    pdf_path: null, notes: null, created_at: '2026-02-01', updated_at: '2026-02-25',
  },
  {
    id: 'inv_005', client_id: 'cli_002', engagement_id: 'eng_002',
    invoice_number: 'JRA-2026-005', description: 'Phase II — Independent Assessment (Asbestos Survey)',
    amount: 12400, status: 'sent', due_date: '2026-05-25', paid_date: null,
    pdf_path: null, notes: 'Multi-building survey', created_at: '2026-04-15', updated_at: '2026-04-15',
  },
  {
    id: 'inv_006', client_id: 'cli_004', engagement_id: 'eng_004',
    invoice_number: 'JRA-2026-006', description: 'Phases I–IV — Full Engagement (Indoor Air Quality)',
    amount: 28500, status: 'paid', due_date: '2026-04-01', paid_date: '2026-04-01',
    pdf_path: null, notes: 'Completed engagement — final invoice', created_at: '2026-04-01', updated_at: '2026-04-01',
  },
];
