/* ── Document Download — Signed URL generation ── */
/* GET /api/documents/download?id=<document_id> */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('id');
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }

  // Verify authenticated user
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch { /* ok */ }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  // Get user role and check access
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin';

  // Admin client for storage operations
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get document record
  const { data: doc, error: docError } = await admin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  // Access check: admins can access all, clients only their own
  if (!isAdmin) {
    const { data: clientRecord } = await admin
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (!clientRecord || clientRecord.id !== doc.client_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
  }

  if (!doc.file_path) {
    return NextResponse.json({ error: 'No file attached to this document' }, { status: 404 });
  }

  // Generate signed URL (1 hour expiry)
  const { data: signedUrl, error: signError } = await admin.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 3600);

  if (signError || !signedUrl) {
    return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
  }

  // Audit log
  await admin.from('audit_log').insert({
    user_id: user.id,
    action: 'document_download',
    entity_type: 'document',
    entity_id: doc.id,
    metadata: { file_path: doc.file_path, document_name: doc.name },
  });

  return NextResponse.json({
    url: signedUrl.signedUrl,
    name: doc.name,
    mime_type: doc.mime_type,
    expires_in: 3600,
  });
}
