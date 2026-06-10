/* ── Mark Message Read API ── */
/* PATCH /api/messages/read — mark one or all messages read */
/* Requires auth: admin can mark any, client can only mark their own */

import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;

  try {
    const body = await req.json();
    const { message_id, client_id } = body;

    if (!message_id && !client_id) {
      return NextResponse.json(
        { error: 'Provide message_id or client_id' },
        { status: 400 },
      );
    }

    /* ── Ownership check: non-admin users can only mark their own messages ── */
    if (!isAdmin) {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();

      if (!clientRec) {
        return NextResponse.json(
          { error: 'Client record not found' },
          { status: 403 },
        );
      }

      if (client_id && client_id !== clientRec.id) {
        return NextResponse.json(
          { error: 'Cannot mark messages for another client' },
          { status: 403 },
        );
      }

      /* When marking a single message, verify it belongs to this client */
      if (message_id) {
        const { data: msg } = await sb
          .from('messages')
          .select('client_id')
          .eq('id', message_id)
          .single();

        if (!msg || msg.client_id !== clientRec.id) {
          return NextResponse.json(
            { error: 'Message not found or not yours' },
            { status: 403 },
          );
        }
      }

      /* Scope bulk mark-read to this client */
      if (!message_id && !client_id) {
        return NextResponse.json(
          { error: 'Provide message_id or client_id' },
          { status: 400 },
        );
      }

      const scopedClientId = client_id ?? clientRec.id;
      if (message_id) {
        const { error } = await sb
          .from('messages')
          .update({ read: true })
          .eq('id', message_id)
          .eq('client_id', scopedClientId);
        if (error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 },
          );
      } else {
        const { error } = await sb
          .from('messages')
          .update({ read: true })
          .eq('client_id', scopedClientId)
          .eq('read', false);
        if (error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 },
          );
      }
    } else {
      /* Admin path — can mark any message/client read */
      if (message_id) {
        const { error } = await sb
          .from('messages')
          .update({ read: true })
          .eq('id', message_id);
        if (error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 },
          );
      } else if (client_id) {
        const { error } = await sb
          .from('messages')
          .update({ read: true })
          .eq('client_id', client_id)
          .eq('read', false);
        if (error)
          return NextResponse.json(
            { error: error.message },
            { status: 500 },
          );
      }
    }

    /* ── Audit log ── */
    await sb.from('audit_log').insert({
      action: 'message_read',
      entity_type: 'message',
      entity_id: message_id ?? client_id,
      actor_id: auth.user.id,
      metadata: {
        message_id: message_id ?? null,
        client_id: client_id ?? null,
        bulk: !message_id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
