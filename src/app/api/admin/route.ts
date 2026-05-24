/* ── GET /api/admin — Server-side admin data fetch (bypasses RLS) ── */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET() {
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [clients, engagements, invoices, messages, documents, timeline, ndas, auditLog] = await Promise.all([
    sb.from('clients').select('*').order('created_at', { ascending: false }),
    sb.from('engagements').select('*').order('created_at', { ascending: false }),
    sb.from('invoices').select('*').order('created_at', { ascending: false }),
    sb.from('messages').select('*').order('created_at', { ascending: false }),
    sb.from('documents').select('*').order('created_at', { ascending: false }),
    sb.from('timeline_events').select('*').order('event_date', { ascending: true }),
    sb.from('nda_records').select('*').order('signed_date', { ascending: false }),
    sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
  ]);

  return NextResponse.json({
    clients: clients.data || [],
    engagements: engagements.data || [],
    invoices: invoices.data || [],
    messages: messages.data || [],
    documents: documents.data || [],
    timeline: timeline.data || [],
    ndas: ndas.data || [],
    auditLog: auditLog.data || [],
  });
}
