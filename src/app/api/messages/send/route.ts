/* ── Send Message API ── */
/* POST /api/messages/send — admin sends to client (or client replies) */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const body = await req.json();
    const { client_id, engagement_id, sender_type, sender_name, subject, body: msgBody } = body;

    if (!client_id || !engagement_id || !sender_type || !sender_name || !subject || !msgBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: msg, error } = await sb
      .from('messages')
      .insert({
        client_id,
        engagement_id,
        sender_type,
        sender_name,
        subject,
        body: msgBody,
        read: sender_type === 'firm',
        encrypted: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Audit log
    await sb.from('audit_log').insert({
      action: 'message_sent',
      entity_type: 'message',
      entity_id: msg.id,
      metadata: { client_id, sender_type, subject },
    });

    return NextResponse.json({ success: true, message: msg });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
