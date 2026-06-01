/* ── E-Signature Request — admin sends doc for client signature ── */
/* Requires admin session */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  const { sb } = auth;

  try {
    const { document_id, client_id, signer_name, signer_email, message } = await req.json();
    if (!document_id || !client_id || !signer_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: sigReq, error } = await sb
      .from('signature_requests')
      .insert({ document_id, client_id, signer_name, signer_email: signer_email || '', message: message || '', status: 'pending' })
      .select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    await sb.from('documents').update({ status: 'pending-review' }).eq('id', document_id);
    await sb.from('audit_log').insert({
      action: 'signature_requested', entity_type: 'signature_request', entity_id: sigReq.id,
      metadata: { document_id, client_id, signer_name, requested_by: auth.user.id },
    });

    return NextResponse.json({ success: true, signatureRequest: sigReq });
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
