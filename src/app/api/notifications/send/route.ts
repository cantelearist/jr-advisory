/* ── POST /api/notifications/send — Send email notifications ── */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendNotification, sendNotifications, type NotificationPayload } from '@/lib/notifications';
import { isInternalSecretAuthorized } from '@/lib/internal-secret';
import { isAuthError, requireAdminWithAccessToken } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  try {
    /* Auth: require service-level access or an AAL2 admin session */
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!isInternalSecretAuthorized(bearerToken, process.env.NOTIFICATION_SECRET)) {
      if (!bearerToken) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const auth = await requireAdminWithAccessToken(bearerToken);
      if (isAuthError(auth)) return auth;
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
