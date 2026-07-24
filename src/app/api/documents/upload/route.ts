/* ── Document Upload — Admin uploads files to Supabase Storage ── */
/* POST /api/documents/upload (multipart form data) */

import { NextResponse, type NextRequest } from 'next/server';
import { validateUploadFile } from '@/lib/sanitize';
import { internalError } from '@/lib/api-error';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import {
  createInAppNotification,
  sendNotification,
  sendNotifications,
} from '@/lib/notifications';

const ADMIN_CATEGORIES = new Set([
  'nda',
  'lab-results',
  'proposals',
  'clearance',
  'invoices',
  'reports',
  'contracts',
  'change-orders',
]);
const CLIENT_CATEGORIES = new Set([
  'lab-results',
  'proposals',
  'invoices',
  'reports',
  'contracts',
]);

export async function POST(req: NextRequest) {
  // 1) Verify caller. Admins can upload for any engagement; clients can only
  // upload to the client record linked to their authenticated profile.
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;
  const { user, isAdmin, sb: admin } = auth;

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
  const allowedCategories = isAdmin ? ADMIN_CATEGORIES : CLIENT_CATEGORIES;
  if (!allowedCategories.has(category)) {
    return NextResponse.json({ error: 'Invalid document category' }, { status: 400 });
  }
  if (docName.trim().length > 200) {
    return NextResponse.json({ error: 'Document name is too long' }, { status: 400 });
  }

  const { data: engagement } = await admin
    .from('engagements')
    .select('id')
    .eq('id', engagementId)
    .eq('client_id', clientId)
    .maybeSingle();
  if (!engagement) {
    return NextResponse.json({ error: 'Engagement does not belong to client' }, { status: 400 });
  }

  const { data: client } = await admin
    .from('clients')
    .select('id, profile_id, name, email')
    .eq('id', clientId)
    .single();
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }
  if (!isAdmin && client.profile_id !== user.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

    let emailSent = false;
    let emailError: string | undefined;
    try {
      if (isAdmin) {
        if (client.email) {
          const result = await sendNotification({
            type: 'document_uploaded',
            recipientEmail: client.email,
            recipientName: client.name,
            data: {
              documentName: docName,
              category,
            },
          });
          emailSent = result.success;
          emailError = result.error;
        }
        await createInAppNotification({
          target: client.id,
          type: 'document',
          title: `New document: ${docName}`,
          body: category,
          link: '/portal/documents',
          metadata: { document_id: doc.id },
        });
      } else {
        const { data: admins } = await admin
          .from('profiles')
          .select('email, full_name')
          .in('role', ['admin', 'manager']);
        const result = await sendNotifications(
          (admins || [])
            .filter((profile: { email?: string }) => Boolean(profile.email))
            .map((profile: { email: string; full_name?: string }) => ({
              type: 'document_uploaded' as const,
              recipientEmail: profile.email,
              recipientName: profile.full_name || 'Advisory Team',
              data: {
                documentName: docName,
                category,
              },
            })),
        );
        emailSent = result.sent > 0;
        emailError = result.failed > 0
          ? `${result.failed} notification${result.failed === 1 ? '' : 's'} failed`
          : undefined;
        await createInAppNotification({
          target: 'firm',
          type: 'document',
          title: `Document uploaded by ${client.name}`,
          body: docName,
          link: '/portal/admin?tab=documents',
          metadata: { client_id: client.id, document_id: doc.id },
        });
      }
    } catch (notificationError) {
      emailError = notificationError instanceof Error
        ? notificationError.message
        : 'Notification failed';
      console.error('documents.upload_notification_failed', notificationError);
    }

    // Strip internal storage paths before returning — never expose file_path or storage_path to clients
    const { file_path: _fp, ...safeDoc } = doc;
    return NextResponse.json({
      success: true,
      document: safeDoc,
      notification: {
        emailSent,
        error: emailError,
      },
    });
  } catch (e: unknown) {
    return internalError(e, 'documents.upload');
  }
}
