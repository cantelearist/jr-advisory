/* ── GET /api/notifications/list — fetch in-app notifications ── */
/* Returns notifications for the current user (admin gets all firm-targeted, client gets their own) */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20', 10);
  const target = req.nextUrl.searchParams.get('target') || 'firm'; // 'firm' or client_id

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
