/* ── Send Message API ── */
/* POST /api/messages/send — admin sends to client (or client replies) */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification, createInAppNotification } from '@/lib/notifications';

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

    // Email + in-app notifications — notify the other party
    try {
      if (sender_type === 'firm') {
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
              senderName: sender_name,
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
          metadata: { sender_name, message_id: msg.id },
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
                senderName: sender_name,
                preview: msgBody.slice(0, 120),
              },
            });
          }
        }
        // In-app notification for admin
        await createInAppNotification({
          target: 'firm',
          type: 'message',
          title: `New message from ${sender_name}`,
          body: subject,
          link: '/portal/admin?tab=messages',
          metadata: { client_id, sender_name, message_id: msg.id },
        });
      }
    } catch (notifErr) {
      console.error('[messages/send] Notification failed (non-blocking):', notifErr);
    }

    return NextResponse.json({ success: true, message: msg });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
