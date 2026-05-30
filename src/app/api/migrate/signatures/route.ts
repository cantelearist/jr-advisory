/* ── Signature table migration helper ── */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  /* Block in production */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (key !== 'jr-migrate-2026') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { error } = await sb.from('signature_requests').select('id').limit(1);
  if (error && error.message.includes('does not exist')) {
    return NextResponse.json({
      status: 'table_missing',
      sql: `CREATE TABLE public.signature_requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
  signer_name text NOT NULL,
  signer_email text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  signature_data text,
  signed_at timestamptz,
  ip_address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_bypass_signatures ON public.signature_requests FOR ALL USING (auth.role() = 'service_role');`,
      instructions: 'Run this SQL in Supabase SQL Editor, then POST again.',
    });
  }

  return NextResponse.json({ success: true, message: 'signature_requests table ready' });
}
