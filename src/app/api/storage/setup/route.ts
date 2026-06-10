/* ── Storage Setup — Create document bucket ── */
/* POST /api/storage/setup?key=jr-storage-2026 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { internalError } from '@/lib/api-error';

const SETUP_KEY = 'jr-storage-2026';

export async function POST(req: NextRequest) {
  /* Block in production */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (key !== SETUP_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  try {
    // Check if bucket already exists
    const { data: buckets } = await admin.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === 'documents');

    if (exists) {
      results.push('Bucket "documents" already exists');
    } else {
      // Create private bucket with 50MB file size limit
      const { error } = await admin.storage.createBucket('documents', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'text/csv',
        ],
      });

      if (error) throw error;
      results.push('✅ Created "documents" bucket (private, 50MB limit)');
    }

    // Verify
    const { data: verify } = await admin.storage.listBuckets();
    const bucket = verify?.find((b) => b.name === 'documents');
    if (bucket) {
      results.push(`Verified: bucket "${bucket.name}" (public: ${bucket.public})`);
    }

    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    return internalError(e, 'storage.setup');
  }
}
