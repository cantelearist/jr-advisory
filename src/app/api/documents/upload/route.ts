/* ── Document Upload — Admin uploads files to Supabase Storage ── */
/* POST /api/documents/upload (multipart form data) */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateUploadFile } from '@/lib/sanitize';

export async function POST(req: NextRequest) {
  // 1) Verify caller is an authenticated admin
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  // 2) Parse multipart form
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const clientId = formData.get('client_id') as string;
  const engagementId = formData.get('engagement_id') as string;
  const category = formData.get('category') as string;
  const docName = formData.get('name') as string;

  if (!file || !clientId || !engagementId || !category || !docName) {
    return NextResponse.json({ error: 'Missing required fields: file, client_id, engagement_id, category, name' }, { status: 400 });
  }

  // Server-side file validation: type, extension, size
  const uploadError = validateUploadFile(file.name, file.type, file.size);
  if (uploadError) {
    return NextResponse.json({ error: uploadError }, { status: 400 });
  }

  // 3) Admin client for storage + DB
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    // Generate safe filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'bin';
    const safeFilename = `${timestamp}-${docName.replace(/[^a-zA-Z0-9-_]/g, '_')}.${ext}`;
    const storagePath = `${clientId}/${engagementId}/${category}/${safeFilename}`;

    // 4) Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // 5) Create document record in DB
    const { data: doc, error: dbError } = await admin
      .from('documents')
      .insert({
        client_id: clientId,
        engagement_id: engagementId,
        name: docName,
        category,
        status: 'final',
        file_path: storagePath,
        file_size: String(file.size),
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    // 6) Audit log
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'document_upload',
      entity_type: 'document',
      entity_id: doc.id,
      metadata: { file_name: file.name, storage_path: storagePath, size: file.size },
    });

    return NextResponse.json({
      success: true,
      document: doc,
      storage_path: storagePath,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
