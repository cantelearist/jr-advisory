/* ── GET /api/admin — Server-side admin data fetch (bypasses RLS) ── */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;

  const [clients, engagements, invoices, changeOrders, messages, documents, timeline, ndas, auditLog, todos] = await Promise.all([
    sb.from('clients').select('*').order('created_at', { ascending: false }),
    sb.from('engagements').select('*').order('created_at', { ascending: false }),
    sb.from('invoices').select('*').order('created_at', { ascending: false }),
    sb.from('change_orders').select('*').order('created_at', { ascending: false }),
    sb.from('messages').select('*').order('created_at', { ascending: false }),
    sb.from('documents').select('*').order('created_at', { ascending: false }),
    sb.from('timeline_events').select('*').order('event_date', { ascending: true }),
    sb.from('nda_records').select('*').order('signed_date', { ascending: false }),
    sb.from('audit_log').select('*').order('created_at', { ascending: false }).limit(200),
    sb.from('todo').select('*').order('created_at', { ascending: false }),
  ]);

  return NextResponse.json({
    clients: clients.data || [],
    engagements: engagements.data || [],
    invoices: invoices.data || [],
    changeOrders: changeOrders.data || [],
    messages: messages.data || [],
    documents: documents.data || [],
    timeline: timeline.data || [],
    ndas: ndas.data || [],
    auditLog: auditLog.data || [],
    todos: todos.data || [],
  });
}
