/* ── Document Delete — Admin removes files ── */
/* DELETE /api/documents/delete?id=<document_id> */

import { NextResponse, type NextRequest } from 'next/server';
import { internalError } from '@/lib/api-error';
import { requireAdmin, isAuthError } from '@/lib/api-auth';

export async function DELETE(req: NextRequest) {
  const documentId = req.nextUrl.searchParams.get('id');
  if (!documentId) {
    return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
  }

  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;
  const { user, sb: admin } = auth;

  // Get document
  const { data: doc, error: docError } = await admin
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  }

  try {
    const { data: sourceChangeOrder, error: sourceLookupError } = await admin
      .from('change_orders')
      .select('id')
      .eq('source_document_id', documentId)
      .limit(1)
      .maybeSingle();
    if (sourceLookupError) {
      return internalError(sourceLookupError, 'documents.change_order_lookup');
    }
    if (sourceChangeOrder) {
      return NextResponse.json(
        { error: 'This contract is an original record for a change order and cannot be deleted' },
        { status: 409 },
      );
    }

    // Delete from storage if file exists
    if (doc.file_path) {
      const { error: storageError } = await admin.storage
        .from('documents')
        .remove([doc.file_path]);

      if (storageError) {
        console.error('documents.storage_delete_failed', {
          documentId,
          filePath: doc.file_path,
          error: storageError,
        });
        // Preserve the database record so the object remains discoverable and
        // the operation can be retried safely.
        return NextResponse.json(
          { error: 'Document storage deletion failed' },
          { status: 502 },
        );
      }
    }

    // Delete DB record
    const { error: dbError } = await admin
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) throw dbError;

    // Audit log
    await admin.from('audit_log').insert({
      user_id: user.id,
      action: 'document_delete',
      entity_type: 'document',
      entity_id: documentId,
      metadata: { file_path: doc.file_path, document_name: doc.name },
    });

    return NextResponse.json({ success: true });
  } catch (e: unknown) {
    return internalError(e, 'documents.delete');
  }
}
