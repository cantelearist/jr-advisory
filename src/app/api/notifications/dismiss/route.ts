/* ── POST /api/notifications/dismiss — mark notification(s) as read ── */
/* Requires auth */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;

  try {
    const body = await req.json();
    const { notification_id, dismiss_all, target } = body;

    // Non-admin users can only dismiss their own notifications
    if (!isAdmin && target) {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();
      if (!clientRec || target !== clientRec.id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (dismiss_all && target) {
      /* Dismiss all for a target */
      const { error } = await sb
        .from('notifications')
        .update({ read: true })
        .eq('target', target)
        .eq('read', false);

      if (error && !error.message.includes('does not exist')) {
        return internalError(error, 'notifications.dismiss');
      }
    } else if (notification_id) {
      /* Dismiss single */
      const { error } = await sb
        .from('notifications')
        .update({ read: true })
        .eq('id', notification_id);

      if (error && !error.message.includes('does not exist')) {
        return internalError(error, 'notifications.dismiss');
      }
    } else {
      return NextResponse.json({ error: 'Provide notification_id or dismiss_all + target' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return internalError(e, 'notifications.dismiss');
  }
}
