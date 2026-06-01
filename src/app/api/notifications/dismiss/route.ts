/* ── POST /api/notifications/dismiss — mark notification(s) as read ── */

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
    const { notification_id, dismiss_all, target } = body;

    if (dismiss_all && target) {
      /* Dismiss all for a target */
      const { error } = await sb
        .from('notifications')
        .update({ read: true })
        .eq('target', target)
        .eq('read', false);

      if (error && !error.message.includes('does not exist')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else if (notification_id) {
      /* Dismiss single */
      const { error } = await sb
        .from('notifications')
        .update({ read: true })
        .eq('id', notification_id);

      if (error && !error.message.includes('does not exist')) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: 'Provide notification_id or dismiss_all + target' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
