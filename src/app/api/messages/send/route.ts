/* ── Send Message API ── */
/* POST /api/messages/send — admin sends to client (or client replies) */
/* Requires auth: admin can send to any client, client can only reply to their own engagement */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendNotification, createInAppNotification } from '@/lib/notifications';
import { internalError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  /* Rate limit: 20 messages per minute per IP */
  const rl = checkRateLimit(getClientIp(req), 'messages-send', { windowMs: 60_000, maxAttempts: 20 });
  if (!rl.allowed) {
    return NextResponse.json({ error: rl.message || 'Too many requests' }, { status: 429 });
  }

  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;

  try {
    const body = await req.json();
    const { client_id, engagement_id, subject, body: msgBody } = body;

    if (!client_id || !engagement_id || !subject || !msgBody) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let senderType: 'firm' | 'client' = 'firm';
    let senderName = auth.profile?.full_name || auth.user.email || 'James Roman Advisory';

    // Non-admin users can only send for their own client record. Sender
    // identity is derived server-side instead of accepted from the request.
    if (!isAdmin) {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id, name')
        .eq('profile_id', auth.user.id)
        .single();

      if (!clientRec || clientRec.id !== client_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      senderType = 'client';
      senderName = clientRec.name;
    }

    // Prevent cross-client foreign-key linkage and misleading audit history.
    const { data: engagement } = await sb
      .from('engagements')
      .select('id')
      .eq('id', engagement_id)
      .eq('client_id', client_id)
      .maybeSingle();

    if (!engagement) {
      return NextResponse.json({ error: 'Engagement does not belong to client' }, { status: 400 });
    }

    const { data: msg, error } = await sb
      .from('messages')
      .insert({
        client_id,
        engagement_id,
        sender_type: senderType,
        sender_name: senderName,
        subject,
        body: msgBody,
        read: senderType === 'firm',
        encrypted: true,
      })
      .select()
      .single();

    if (error) {
      return internalError(error, 'messages.send');
    }

    // Audit log
    await sb.from('audit_log').insert({
      action: 'message_sent',
      entity_type: 'message',
      entity_id: msg.id,
      metadata: { client_id, sender_type: senderType, subject },
    });

    // Email + in-app notifications — notify the other party
    try {
      if (senderType === 'firm') {
        // Admin sent → notify client
        const { data: client } = await sb
          .from('clients')
          .select('name, email')
          .eq('id', client_id)
          .single();
        if (client?.email) {
          await sendNotification({
            type: 'new_message',
            recipientEmail: client.email,
            recipientName: client.name,
            data: {
              subject,
              senderName,
              preview: msgBody.slice(0, 120),
            },
          });
        }
        // In-app notification for client
        await createInAppNotification({
          target: client_id,
          type: 'message',
          title: `New message: ${subject}`,
          body: msgBody.slice(0, 120),
          link: '/portal/messages',
          metadata: { sender_name: senderName, message_id: msg.id },
        });
      } else {
        // Client sent → notify admins (email)
        const { data: admins } = await sb
          .from('profiles')
          .select('email, full_name')
          .eq('role', 'admin');
        if (admins) {
          for (const admin of admins) {
            await sendNotification({
              type: 'new_message',
              recipientEmail: admin.email,
              recipientName: admin.full_name,
              data: {
                subject,
                senderName,
                preview: msgBody.slice(0, 120),
              },
            });
          }
        }
        // In-app notification for admin
        await createInAppNotification({
          target: 'firm',
          type: 'message',
          title: `New message from ${senderName}`,
          body: subject,
          link: '/portal/admin?tab=messages',
          metadata: { client_id, sender_name: senderName, message_id: msg.id },
        });
      }
    } catch (notifErr) {
      console.error('[messages/send] Notification failed (non-blocking):', notifErr);
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (e: unknown) {
    return internalError(e, 'messages.send');
  }
}
