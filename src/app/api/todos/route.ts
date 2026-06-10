/* ── GET/POST /api/todos — List and create todos ── */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const clientId = req.nextUrl.searchParams.get('client_id');
  const status = req.nextUrl.searchParams.get('status');

  let q = sb.from('todo').select('*').order('created_at', { ascending: false });
  if (clientId) q = q.eq('client_id', clientId);
  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return internalError(error, 'todos');
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const body = await req.json();
  const { title, description, priority, client_id, engagement_id, assigned_to, due_date, visible_to_client } = body;

  if (!title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const { data, error } = await sb.from('todo').insert({
    title,
    description: description || null,
    priority: priority || 'normal',
    status: 'pending',
    client_id: client_id || null,
    engagement_id: engagement_id || null,
    assigned_to: assigned_to || null,
    due_date: due_date || null,
    visible_to_client: visible_to_client ?? false,
  }).select().single();

  if (error) return internalError(error, 'todos');
  return NextResponse.json(data, { status: 201 });
}
