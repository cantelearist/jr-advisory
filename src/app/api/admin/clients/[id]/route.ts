/* ── GET /api/admin/clients/[id] — Single client with all related data ── */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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
