/* ── Data Layer ── */
/* Unified data access: requires Supabase. No demo mode fallback. */

import { getSupabase, isSupabaseConfigured } from './supabase';
import type {
  Client,
  Engagement,
  Document,
  Message,
  TimelineEvent,
  Invoice,
} from './database.types';

/* ── Guard: fail loudly if Supabase is missing ── */

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Demo mode has been removed.',
    );
  }
  return getSupabase();
}

/* ── Queries ── */

export async function fetchClient(clientId: string): Promise<Client | null> {
  const sb = requireSupabase();
  const { data } = await sb.from('clients').select('*').eq('id', clientId).single();
  return (data as Client) || null;
}

export async function fetchAllClients(): Promise<Client[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('clients').select('*').order('created_at', { ascending: false });
  return (data as Client[]) || [];
}

export async function fetchEngagement(clientId: string): Promise<Engagement | null> {
  const sb = requireSupabase();
  const { data } = await sb.from('engagements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single();
  return (data as Engagement) || null;
}

export async function fetchAllEngagements(): Promise<Engagement[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('engagements').select('*').order('created_at', { ascending: false });
  return (data as Engagement[]) || [];
}

export async function fetchDocuments(clientId: string): Promise<Document[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Document[]) || [];
}

export async function fetchMessages(clientId: string): Promise<Message[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Message[]) || [];
}

export async function fetchTimeline(engagementId: string): Promise<TimelineEvent[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('timeline_events').select('*').eq('engagement_id', engagementId).order('event_date', { ascending: true });
  return (data as TimelineEvent[]) || [];
}

export async function fetchInvoices(clientId: string): Promise<Invoice[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
}

export async function fetchAllInvoices(): Promise<Invoice[]> {
  const sb = requireSupabase();
  const { data } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
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
  const sb = requireSupabase();
  const { data } = await sb.from('messages').insert(msg as Record<string, unknown>).select().single();
  return (data as Message) || null;
}

export async function markMessageRead(messageId: string): Promise<void> {
  const sb = requireSupabase();
  await sb.from('messages').update({ read: true } as Record<string, unknown>).eq('id', messageId);
}

export async function updateEngagementPhase(
  engagementId: string,
  phase: '1' | '2' | '3' | '4',
  phaseLabel: string,
): Promise<void> {
  const sb = requireSupabase();
  await sb.from('engagements').update({ phase, phase_label: phaseLabel } as Record<string, unknown>).eq('id', engagementId);
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
  const sb = requireSupabase();
  const { data } = await sb.from('clients').insert(input as Record<string, unknown>).select().single();
  if (!data) throw new Error('Failed to create client');
  return data as Client;
}

export async function updateClient(
  clientId: string,
  updates: Partial<Pick<Client, 'name' | 'email' | 'phone' | 'property' | 'area' | 'status' | 'notes'>>,
): Promise<void> {
  const sb = requireSupabase();
  await sb.from('clients').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', clientId);
}

export async function deleteClient(clientId: string): Promise<void> {
  const sb = requireSupabase();
  await sb.from('clients').delete().eq('id', clientId);
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
  const sb = requireSupabase();
  const { data } = await sb.from('engagements').insert(input as Record<string, unknown>).select().single();
  if (!data) throw new Error('Failed to create engagement');
  return data as Engagement;
}

export async function updateEngagement(
  engagementId: string,
  updates: Partial<Pick<Engagement, 'type' | 'phase' | 'phase_label' | 'next_milestone' | 'notes'>>,
): Promise<void> {
  const sb = requireSupabase();
  await sb.from('engagements').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', engagementId);
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
  const sb = requireSupabase();
  const { data } = await sb.from('invoices').insert(input as Record<string, unknown>).select().single();
  if (!data) throw new Error('Failed to create invoice');
  return data as Invoice;
}

export async function updateInvoice(
  invoiceId: string,
  updates: Partial<Pick<Invoice, 'status' | 'amount' | 'description' | 'due_date' | 'paid_date' | 'notes'>>,
): Promise<void> {
  const sb = requireSupabase();
  await sb.from('invoices').update({ ...updates, updated_at: new Date().toISOString() } as Record<string, unknown>).eq('id', invoiceId);
}

/* ── Admin Data (server-side, bypasses RLS) ── */

export interface AdminData {
  clients: Client[];
  engagements: Engagement[];
  invoices: Invoice[];
  messages: Message[];
  documents: Document[];
  timeline: TimelineEvent[];
  auditLog: { id: string; user_id: string | null; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> | null; ip_address: string | null; created_at: string }[];
  todos: { id: string; client_id: string | null; engagement_id: string | null; assigned_to: string | null; title: string; description: string | null; priority: string; status: string; due_date: string | null; completed_at: string | null; visible_to_client: boolean; created_by: string | null; created_at: string; updated_at: string }[];
}

export async function fetchAdminData(): Promise<AdminData> {
  requireSupabase(); // Fail early if not configured
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
    todos: data.todos || [],
  };
}
