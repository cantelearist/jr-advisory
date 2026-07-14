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
    let callerTarget: string | null = null;

    // Resolve the caller's target once and apply it to every mutation path.
    if (!isAdmin) {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();
      if (!clientRec || (target && target !== clientRec.id)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      callerTarget = clientRec.id;
    }

    if (dismiss_all) {
      const effectiveTarget = isAdmin ? target : callerTarget;
      if (!effectiveTarget) {
        return NextResponse.json({ error: 'Target required' }, { status: 400 });
      }
      /* Dismiss all for a target */
      const { error } = await sb
        .from('notifications')
        .update({ read: true })
        .eq('target', effectiveTarget)
        .eq('read', false);

      if (error && !error.message.includes('does not exist')) {
        return internalError(error, 'notifications.dismiss');
      }
    } else if (notification_id) {
      /* Dismiss single */
      let update = sb
        .from('notifications')
        .update({ read: true })
        .eq('id', notification_id);

      if (callerTarget) {
        update = update.eq('target', callerTarget);
      }

      const { data, error } = await update.select('id');

      if (error && !error.message.includes('does not exist')) {
        return internalError(error, 'notifications.dismiss');
      }
      if (!error && (!data || data.length === 0)) {
        return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Provide notification_id or dismiss_all' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return internalError(e, 'notifications.dismiss');
  }
}
