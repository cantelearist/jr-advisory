/* ── E-Signature List — list signature requests ── */
/* Requires auth: admin sees all, client sees only their own */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const { sb, isAdmin } = auth;
  const clientId = req.nextUrl.searchParams.get('client_id');

  let query = sb
    .from('signature_requests')
    .select('*, documents(name, category), clients(name, email, property)')
    .order('created_at', { ascending: false });

  if (isAdmin && clientId) {
    query = query.eq('client_id', clientId);
  } else if (!isAdmin) {
    // Client: scope to their own client record
    const { data: clientRec } = await sb
      .from('clients')
      .select('id')
      .eq('profile_id', auth.user.id)
      .single();

    if (!clientRec) {
      return NextResponse.json({ signatures: [] });
    }
    query = query.eq('client_id', clientRec.id);
  }

  const { data, error } = await query;
  if (error) return internalError(error, 'signatures.list');
  return NextResponse.json({ signatures: data || [] });
}
