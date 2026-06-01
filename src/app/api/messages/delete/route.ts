/* ── Delete Message API ── */
/* DELETE /api/messages/delete — admin deletes a message */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function DELETE(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body = await req.json();
    const { message_id } = body;

    if (!message_id) {
      return NextResponse.json({ error: 'message_id required' }, { status: 400 });
    }

    /* Fetch message before deleting (for audit) */
    const { data: msg } = await sb
      .from('messages')
      .select('id, client_id, subject, sender_type')
      .eq('id', message_id)
      .single();

    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { error } = await sb
      .from('messages')
      .delete()
      .eq('id', message_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    /* Audit log */
    await sb.from('audit_log').insert({
      action: 'message_deleted',
      entity_type: 'message',
      entity_id: msg.id,
      metadata: {
        client_id: msg.client_id,
        subject: msg.subject,
        sender_type: msg.sender_type,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
