/* ── Portal Data Layer — API-first with Supabase fallback ── */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Client, Engagement, Document, Message, TimelineEvent, Invoice, Todo,
} from './database.types';

export interface PortalData {
  client: Client | null;
  engagement: Engagement | null;
  documents: Document[];
  messages: Message[];
  timeline: TimelineEvent[];
  invoices: Invoice[];
  todos: Todo[];
  /** Present when the authenticated API could not be reached. */
  error?: 'unauthorized' | 'forbidden' | 'unavailable';
}

export const PORTAL_DATA_TIMEOUT_MS = 10_000;

function emptyPortalData(error?: PortalData['error']): PortalData {
  return {
    client: null,
    engagement: null,
    documents: [],
    messages: [],
    timeline: [],
    invoices: [],
    todos: [],
    ...(error ? { error } : {}),
  };
}

/** Primary: fetch all portal data via authenticated API route (bypasses RLS) */
export async function fetchPortalData(clientId?: string): Promise<PortalData> {
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), PORTAL_DATA_TIMEOUT_MS) : null;

  try {
    const url = clientId ? `/api/portal/data?client_id=${clientId}` : '/api/portal/data';
    const res = await fetch(url, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...(controller ? { signal: controller.signal } : {}),
    });

    if (!res.ok) {
      if (res.status === 401) return emptyPortalData('unauthorized');
      if (res.status === 403) return emptyPortalData('forbidden');
      return emptyPortalData('unavailable');
    }

    const data = await res.json();
    return {
      client: data.client || null,
      engagement: data.engagement || null,
      documents: (data.documents as Document[]) || [],
      messages: (data.messages as Message[]) || [],
      timeline: (data.timeline as TimelineEvent[]) || [],
      invoices: (data.invoices as Invoice[]) || [],
      todos: (data.todos as Todo[]) || [],
    };
  } catch {
    return emptyPortalData('unavailable');
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
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

export async function getMyTodos(sb: SupabaseClient): Promise<Todo[]> {
  const { data } = await sb.from('todo').select('*').eq('visible_to_client', true).neq('status', 'done').order('priority', { ascending: true }).order('created_at', { ascending: false });
  return (data as Todo[]) || [];
}

/** Legacy: full fetch via direct Supabase queries */
export async function getMyPortalData(sb: SupabaseClient): Promise<PortalData> {
  const [client, engagement, documents, messages, invoices, todos] = await Promise.all([
    getMyClient(sb), getMyEngagement(sb), getMyDocuments(sb),
    getMyMessages(sb), getMyInvoices(sb), getMyTodos(sb),
  ]);
  let timeline: TimelineEvent[] = [];
  if (engagement) timeline = await getMyTimeline(sb, engagement.id);
  return { client, engagement, documents, messages, timeline, invoices, todos };
}
