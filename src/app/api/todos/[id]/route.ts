/* ── PATCH/DELETE /api/todos/[id] — Update and delete todos ── */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const { id } = await params;
  const body = await req.json();

  // If marking done, set completed_at
  const updates = { ...body, updated_at: new Date().toISOString() };
  if (body.status === 'done' && !body.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  if (body.status && body.status !== 'done') {
    updates.completed_at = null;
  }

  const { data, error } = await sb
    .from('todo')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;
  const { id } = await params;
  const { error } = await sb.from('todo').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
