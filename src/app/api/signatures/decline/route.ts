/* ── E-Signature Decline — client declines a signature request ── */
import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const response = NextResponse.next();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { signature_request_id, reason } = await req.json();
    if (!signature_request_id) {
      return NextResponse.json({ error: 'Missing signature_request_id' }, { status: 400 });
    }

    /* Verify the request exists and is pending */
    const { data: sigReq } = await sb
      .from('signature_requests')
      .select('*, documents(name)')
      .eq('id', signature_request_id)
      .single();

    if (!sigReq) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (sigReq.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    /* Update status to declined */
    const { data: updated, error } = await sb
      .from('signature_requests')
      .update({
        status: 'declined',
        signature_data: reason ? `DECLINED: ${reason}` : 'DECLINED',
        signed_at: new Date().toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      })
      .eq('id', signature_request_id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    /* Audit log */
    await sb.from('audit_log').insert({
      action: 'signature_declined',
      entity_type: 'signature_request',
      entity_id: signature_request_id,
      metadata: {
        document_id: sigReq.document_id,
        signer: user.email,
        reason: reason || null,
        ip: req.headers.get('x-forwarded-for') || 'unknown',
      },
    });

    /* Add timeline event */
    const docName = (sigReq.documents as Record<string, string> | null)?.name;
    if (docName) {
      const { data: eng } = await sb
        .from('engagements')
        .select('id, phase')
        .eq('client_id', sigReq.client_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (eng) {
        await sb.from('timeline_events').insert({
          engagement_id: eng.id,
          phase: eng.phase,
          title: `${docName} — signature declined by ${sigReq.signer_name}`,
          event_type: 'document',
          event_date: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true, signature: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
