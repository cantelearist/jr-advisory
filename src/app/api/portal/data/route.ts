/* ── Portal Data API — authenticated client data endpoint ── */
/* Bypasses RLS by using service role key after verifying user session */

import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, user, profile, isAdmin } = auth;
  const requestedClientId = req.nextUrl.searchParams.get('client_id');
  let clientRecord: Record<string, unknown> | null = null;

  if (isAdmin && requestedClientId) {
    const { data } = await sb
      .from('clients')
      .select('id, profile_id, name, email, phone, property, area, status, notes, created_at, updated_at')
      .eq('id', requestedClientId)
      .maybeSingle();
    clientRecord = data;
  } else if (!isAdmin) {
    const { data } = await sb
      .from('clients')
      .select('id, profile_id, name, email, phone, property, area, status, notes, created_at, updated_at')
      .eq('profile_id', user.id)
      .maybeSingle();
    clientRecord = data;
  }

  const clientId = typeof clientRecord?.id === 'string' ? clientRecord.id : null;

  if (!clientId) {
    return NextResponse.json({
      profile, isAdmin, client: null, engagement: null,
      documents: [], messages: [], timeline: [], invoices: [], todos: [],
    });
  }

  const [
    { data: engagement },
    { data: documents },
    { data: messages },
    { data: invoices },
    { data: todos },
  ] = await Promise.all([
    sb.from('engagements')
      .select('id, client_id, type, phase, phase_label, start_date, next_milestone, property, notes, created_at, updated_at')
      .eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('documents')
      .select('id, client_id, engagement_id, name, category, status, file_size, mime_type, created_at, updated_at')
      .eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('messages')
      .select('id, client_id, engagement_id, sender_type, sender_name, subject, body, read, encrypted, created_at')
      .eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('invoices')
      .select('id, client_id, engagement_id, invoice_number, description, amount, status, due_date, paid_date, notes, stripe_session_id, created_at, updated_at')
      .eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('todo')
      .select('id, client_id, engagement_id, title, description, priority, status, due_date, completed_at, visible_to_client, created_at, updated_at')
      .eq('client_id', clientId).eq('visible_to_client', true).neq('status', 'done').order('priority', { ascending: true }),
  ]);

  let timeline: unknown[] = [];
  if (engagement) {
    const { data: events } = await sb.from('timeline_events')
      .select('id, engagement_id, phase, title, description, event_type, event_date, created_at')
      .eq('engagement_id', engagement.id).order('event_date', { ascending: true });
    timeline = events || [];
  }

  return NextResponse.json({
    profile, isAdmin,
    client: clientRecord,
    engagement: engagement || null,
    documents: documents || [],
    messages: messages || [],
    timeline,
    invoices: invoices || [],
    todos: todos || [],
  });
}
