/* ── E-Signature Sign — client signs a document ── */
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
    const { signature_request_id, signature_data, ip_address } = await req.json();
    if (!signature_request_id || !signature_data) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: sigReq } = await sb
      .from('signature_requests')
      .select('*, documents(name)')
      .eq('id', signature_request_id).single();

    if (!sigReq) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const clientIp = ip_address || req.headers.get('x-forwarded-for') || 'unknown';
    const { data: updated, error } = await sb
      .from('signature_requests')
      .update({
        status: 'signed', signature_data,
        signed_at: new Date().toISOString(),
        ip_address: clientIp,
      })
      .eq('id', signature_request_id).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await sb.from('documents').update({ status: 'final' }).eq('id', sigReq.document_id);
    await sb.from('audit_log').insert({
      action: 'document_signed', entity_type: 'signature_request', entity_id: signature_request_id,
      metadata: { document_id: sigReq.document_id, signer: user.email, ip: clientIp },
    });

    // Add timeline event
    const docName = (sigReq.documents as Record<string, string> | null)?.name;
    if (docName) {
      const { data: eng } = await sb.from('engagements').select('id, phase')
        .eq('client_id', sigReq.client_id).order('created_at', { ascending: false }).limit(1).single();
      if (eng) {
        await sb.from('timeline_events').insert({
          engagement_id: eng.id, phase: eng.phase,
          title: `${docName} signed by ${sigReq.signer_name}`,
          event_type: 'document', event_date: new Date().toISOString(),
        });
      }
    }

    return NextResponse.json({ success: true, signature: updated });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
