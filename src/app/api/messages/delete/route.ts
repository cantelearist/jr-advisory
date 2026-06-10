/* ── Delete Message API ── */
/* DELETE /api/messages/delete — admin deletes a message */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;

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
      return internalError(error, 'messages.delete');
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
        deleted_by: auth.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return internalError(e, 'messages.delete');
  }
}
