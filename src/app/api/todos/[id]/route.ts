/* ── PATCH/DELETE /api/todos/[id] — Update and delete todos ── */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function sb() {
  return createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseUrl || !serviceKey)
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });

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

  const { data, error } = await sb()
    .from('todos')
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
  if (!supabaseUrl || !serviceKey)
    return NextResponse.json({ error: 'Not configured' }, { status: 500 });

  const { id } = await params;
  const { error } = await sb().from('todos').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
