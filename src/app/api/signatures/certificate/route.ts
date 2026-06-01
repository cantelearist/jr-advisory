/* ── Signature Certificate — returns audit data for a signed document ── */
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: sigReq, error } = await sb
    .from('signature_requests')
    .select('*, documents(name, category), clients(name, email, property)')
    .eq('id', id)
    .single();

  if (error || !sigReq) {
    return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
  }

  /* Fetch related audit log entries */
  const { data: auditEntries } = await sb
    .from('audit_log')
    .select('*')
    .eq('entity_type', 'signature_request')
    .eq('entity_id', id)
    .order('created_at', { ascending: true });

  const doc = sigReq.documents as Record<string, string> | null;
  const client = sigReq.clients as Record<string, string> | null;

  const certificate = {
    id: sigReq.id,
    status: sigReq.status,
    document: {
      id: sigReq.document_id,
      name: doc?.name || 'Unknown',
      category: doc?.category || 'unknown',
    },
    client: {
      id: sigReq.client_id,
      name: client?.name || sigReq.signer_name,
      email: client?.email || sigReq.signer_email,
      property: client?.property || null,
    },
    signer: {
      name: sigReq.signer_name,
      email: sigReq.signer_email,
    },
    message: sigReq.message,
    signature_data: sigReq.signature_data,
    requested_at: sigReq.created_at,
    signed_at: sigReq.signed_at,
    ip_address: sigReq.ip_address,
    audit_trail: (auditEntries || []).map((e: Record<string, unknown>) => ({
      action: e.action,
      timestamp: e.created_at,
      ip: e.ip_address,
      metadata: e.metadata,
    })),
  };

  return NextResponse.json({ certificate });
}
