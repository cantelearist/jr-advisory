/* ── E-Signature List — list signature requests ── */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const clientId = req.nextUrl.searchParams.get('client_id');
  let query = sb
    .from('signature_requests')
    .select('*, documents(name, category), clients(name, email, property)')
    .order('created_at', { ascending: false });
  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ signatures: data || [] });
}
