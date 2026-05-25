/* ── Portal Data Layer — auth-aware queries (RLS enforced) ── */
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Client,
  Engagement,
  Document,
  Message,
  TimelineEvent,
  Invoice,
  Todo,
} from './database.types';

/* Client's own record (RLS returns only theirs) */
export async function getMyClient(supabase: SupabaseClient): Promise<Client | null> {
  const { data } = await supabase.from('clients').select('*').limit(1).single();
  return data as Client | null;
}

/* Client's engagement */
export async function getMyEngagement(supabase: SupabaseClient): Promise<Engagement | null> {
  const { data } = await supabase
    .from('engagements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data as Engagement | null;
}

/* Client's documents */
export async function getMyDocuments(supabase: SupabaseClient): Promise<Document[]> {
  const { data } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Document[]) || [];
}

/* Client's messages */
export async function getMyMessages(supabase: SupabaseClient): Promise<Message[]> {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Message[]) || [];
}

/* Client's timeline events */
export async function getMyTimeline(
  supabase: SupabaseClient,
  engagementId?: string
): Promise<TimelineEvent[]> {
  let q = supabase
    .from('timeline_events')
    .select('*')
    .order('event_date', { ascending: true });
  if (engagementId) {
    q = q.eq('engagement_id', engagementId);
  }
  const { data } = await q;
  return (data as TimelineEvent[]) || [];
}

/* Client's invoices */
export async function getMyInvoices(supabase: SupabaseClient): Promise<Invoice[]> {
  const { data } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as Invoice[]) || [];
}

/* Client's visible todos */
export async function getMyTodos(supabase: SupabaseClient): Promise<Todo[]> {
  const { data } = await supabase
    .from('todos')
    .select('*')
    .eq('visible_to_client', true)
    .neq('status', 'done')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false });
  return (data as Todo[]) || [];
}

/* Full portal data bundle (single fetch, good for dashboard) */
export interface PortalData {
  client: Client | null;
  engagement: Engagement | null;
  documents: Document[];
  messages: Message[];
  timeline: TimelineEvent[];
  invoices: Invoice[];
  todos: Todo[];
}

export async function getMyPortalData(supabase: SupabaseClient): Promise<PortalData> {
  // Parallel fetches — RLS ensures per-user filtering
  const [client, engagement, documents, messages, invoices, todos] = await Promise.all([
    getMyClient(supabase),
    getMyEngagement(supabase),
    getMyDocuments(supabase),
    getMyMessages(supabase),
    getMyInvoices(supabase),
    getMyTodos(supabase),
  ]);

  let timeline: TimelineEvent[] = [];
  if (engagement) {
    timeline = await getMyTimeline(supabase, engagement.id);
  }

  return { client, engagement, documents, messages, timeline, invoices, todos };
}
