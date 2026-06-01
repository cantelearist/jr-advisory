/* ── GET /api/notifications/list — fetch in-app notifications ── */
/* Requires auth: admin gets firm-targeted, client gets their own */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);

  // Determine target: admin → 'firm', client → their client_id
  let target = req.nextUrl.searchParams.get('target');
  if (!target) {
    if (isAdmin) {
      target = 'firm';
    } else {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();
      target = clientRec?.id || 'unknown';
    }
  } else if (!isAdmin) {
    // Non-admin users can only query their own notifications
    const { data: clientRec } = await sb
      .from('clients')
      .select('id')
      .eq('profile_id', auth.user.id)
      .single();
    if (!clientRec || target !== clientRec.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  try {
    const { data, error } = await sb
      .from('notifications')
      .select('*')
      .eq('target', target)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      /* If table doesn't exist yet, return empty gracefully */
      if (error.code === '42P01' || error.message.includes('does not exist')) {
        return NextResponse.json({ notifications: [], fallback: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
