/* ── POST /api/notifications/send — Send email notifications ── */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendNotification, sendNotifications, type NotificationPayload } from '@/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    /* Auth: require service-level access or valid admin session */
    const authHeader = req.headers.get('authorization');
    const internalKey = process.env.NOTIFICATION_SECRET || 'jr-notify-2026';

    if (authHeader !== `Bearer ${internalKey}`) {
      /* Fallback: check if user is admin via Supabase token */
      const token = authHeader?.replace('Bearer ', '');
      if (token && supabaseUrl && serviceKey) {
        const sb = createClient(supabaseUrl, serviceKey);
        const { data: { user } } = await sb.auth.getUser(token);
        if (user) {
          const { data: profile } = await sb
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
          }
        } else {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json();

    /* Single notification */
    if (body.type && body.recipientEmail) {
      const payload: NotificationPayload = {
        type: body.type,
        recipientEmail: body.recipientEmail,
        recipientName: body.recipientName || 'Client',
        data: body.data || {},
      };
      const result = await sendNotification(payload);
      return NextResponse.json(result);
    }

    /* Batch notifications */
    if (Array.isArray(body.notifications)) {
      const result = await sendNotifications(body.notifications);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
