/* ── List Messages API ── */
/* GET /api/messages/list?client_id=xxx */
/* Requires auth: admin sees all, client sees only their own */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

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
      return internalError(error, 'messages.list');
    }

    return NextResponse.json({ messages: data || [] });
  } catch (e: unknown) {
    return internalError(e, 'messages.list');
  }
}
