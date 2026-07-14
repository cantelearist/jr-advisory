/* ── Document Upload — Admin uploads files to Supabase Storage ── */
/* POST /api/documents/upload (multipart form data) */

import { NextResponse, type NextRequest } from 'next/server';
import { validateUploadFile } from '@/lib/sanitize';
import { internalError } from '@/lib/api-error';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function POST(req: NextRequest) {
  // 1) Verify caller through the shared trusted-role and MFA gate.
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { user, sb: admin } = auth;

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

    if (dbError) {
      // Storage and Postgres cannot share a transaction. Compensate immediately
      // so a failed row insert does not leave a confidential orphaned object.
      const { error: cleanupError } = await admin.storage
        .from('documents')
        .remove([storagePath]);
      if (cleanupError) {
        console.error('documents.upload_cleanup_failed', {
          storagePath,
          error: cleanupError,
        });
      }
      throw dbError;
    }

    // 6) Audit log
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'document_upload',
      entity_type: 'document',
      entity_id: doc.id,
      metadata: { file_name: file.name, storage_path: storagePath, size: file.size },
    });

    // Strip internal storage paths before returning — never expose file_path or storage_path to clients
    const { file_path: _fp, ...safeDoc } = doc;
    return NextResponse.json({
      success: true,
      document: safeDoc,
    });
  } catch (e: unknown) {
    return internalError(e, 'documents.upload');
  }
}
