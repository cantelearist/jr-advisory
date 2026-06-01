/* ── GET /api/admin/clients/[id] — Single client with all related data ── */
/* Requires admin session */

export const dynamic = 'force-dynamic';

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const { id } = await params;

  const [client, engagements, invoices, messages, documents, ndas] = await Promise.all([
    sb.from('clients').select('*').eq('id', id).single(),
    sb.from('engagements').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    sb.from('invoices').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    sb.from('messages').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    sb.from('documents').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    sb.from('nda_records').select('*').eq('client_id', id).order('signed_date', { ascending: false }),
  ]);

  if (!client.data) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  // Fetch timeline events for all this client's engagements
  const engIds = (engagements.data || []).map((e: { id: string }) => e.id);
  let timeline: { data: unknown[] | null } = { data: [] };
  if (engIds.length > 0) {
    timeline = await sb
      .from('timeline_events')
      .select('*')
      .in('engagement_id', engIds)
      .order('event_date', { ascending: false });
  }

  // Fetch profile (if linked)
  let profile = null;
  if (client.data.profile_id) {
    const { data: prof } = await sb
      .from('profiles')
      .select('id,full_name,email,role,created_at')
      .eq('id', client.data.profile_id)
      .single();
    profile = prof;
  }

  return NextResponse.json({
    client: client.data,
    profile,
    engagements: engagements.data || [],
    invoices: invoices.data || [],
    messages: messages.data || [],
    documents: documents.data || [],
    timeline: timeline.data || [],
    ndas: ndas.data || [],
  });
}
