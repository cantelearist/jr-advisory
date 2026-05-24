/* ── Mark Message Read API ── */
/* PATCH /api/messages/read — mark one or all messages read */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body = await req.json();
    const { message_id, client_id } = body;

    if (message_id) {
      const { error } = await sb
        .from('messages')
        .update({ read: true })
        .eq('id', message_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else if (client_id) {
      const { error } = await sb
        .from('messages')
        .update({ read: true })
        .eq('client_id', client_id)
        .eq('read', false);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Provide message_id or client_id' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
