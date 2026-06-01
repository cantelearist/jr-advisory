/* ── List Messages API ── */
/* GET /api/messages/list?client_id=xxx */
/* Requires auth: admin sees all, client sees only their own */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;
  const clientId = req.nextUrl.searchParams.get('client_id');

  try {
    let query = sb
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (isAdmin && clientId) {
      // Admin filtering by specific client
      query = query.eq('client_id', clientId);
    } else if (!isAdmin) {
      // Client: scope to their own client record
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();

      if (!clientRec) {
        return NextResponse.json({ messages: [] });
      }
      query = query.eq('client_id', clientRec.id);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 });
  }
}
