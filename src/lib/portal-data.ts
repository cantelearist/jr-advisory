/* ── Portal Data Layer — API-first with Supabase fallback ── */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Client, Engagement, Document, Message, TimelineEvent, Invoice, Todo, ChangeOrder,
} from './database.types';

export interface PortalData {
  client: Client | null;
  engagement: Engagement | null;
  documents: Document[];
  messages: Message[];
  timeline: TimelineEvent[];
  invoices: Invoice[];
  changeOrders: ChangeOrder[];
  todos: Todo[];
}

/** Primary: fetch all portal data via authenticated API route (bypasses RLS) */
export async function fetchPortalData(clientId?: string): Promise<PortalData> {
  try {
    const url = clientId ? `/api/portal/data?client_id=${clientId}` : '/api/portal/data';
    const res = await fetch(url);
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return {
      client: data.client || null,
      engagement: data.engagement || null,
      documents: (data.documents as Document[]) || [],
      messages: (data.messages as Message[]) || [],
      timeline: (data.timeline as TimelineEvent[]) || [],
      invoices: (data.invoices as Invoice[]) || [],
      changeOrders: (data.changeOrders as ChangeOrder[]) || [],
      todos: (data.todos as Todo[]) || [],
    };
  } catch {
    return { client: null, engagement: null, documents: [], messages: [], timeline: [], invoices: [], changeOrders: [], todos: [] };
  }
}

/* ── Legacy Supabase-direct queries (kept for backward compat) ── */
export async function getMyClient(sb: SupabaseClient): Promise<Client | null> {
  const { data } = await sb.from('clients').select('*').limit(1).single();
  return data as Client | null;
}

export async function getMyEngagement(sb: SupabaseClient): Promise<Engagement | null> {
  const { data } = await sb.from('engagements').select('*').order('created_at', { ascending: false }).limit(1).single();
  return data as Engagement | null;
}

export async function getMyDocuments(sb: SupabaseClient): Promise<Document[]> {
  const { data } = await sb.from('documents').select('*').order('created_at', { ascending: false });
  return (data as Document[]) || [];
}

export async function getMyMessages(sb: SupabaseClient): Promise<Message[]> {
  const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false });
  return (data as Message[]) || [];
}

export async function getMyTimeline(sb: SupabaseClient, engagementId?: string): Promise<TimelineEvent[]> {
  let q = sb.from('timeline_events').select('*').order('event_date', { ascending: true });
  if (engagementId) q = q.eq('engagement_id', engagementId);
  const { data } = await q;
  return (data as TimelineEvent[]) || [];
}

export async function getMyInvoices(sb: SupabaseClient): Promise<Invoice[]> {
  const { data } = await sb.from('invoices').select('*').order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
}

export async function getMyChangeOrders(sb: SupabaseClient): Promise<ChangeOrder[]> {
  const { data } = await sb.from('change_orders').select('*').order('created_at', { ascending: false });
  return (data as ChangeOrder[]) || [];
}

export async function getMyTodos(sb: SupabaseClient): Promise<Todo[]> {
  const { data } = await sb.from('todo').select('*').eq('visible_to_client', true).neq('status', 'done').order('priority', { ascending: true }).order('created_at', { ascending: false });
  return (data as Todo[]) || [];
}

/** Legacy: full fetch via direct Supabase queries */
export async function getMyPortalData(sb: SupabaseClient): Promise<PortalData> {
  const [client, engagement, documents, messages, invoices, changeOrders, todos] = await Promise.all([
    getMyClient(sb), getMyEngagement(sb), getMyDocuments(sb),
    getMyMessages(sb), getMyInvoices(sb), getMyChangeOrders(sb), getMyTodos(sb),
  ]);
  let timeline: TimelineEvent[] = [];
  if (engagement) timeline = await getMyTimeline(sb, engagement.id);
  return { client, engagement, documents, messages, timeline, invoices, changeOrders, todos };
}
