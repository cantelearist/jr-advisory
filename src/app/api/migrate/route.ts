/* ── POST /api/migrate?key=jr-migrate-2026 — Check & report missing tables ── */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const REQUIRED_TABLES = [
  'profiles', 'clients', 'engagements', 'documents', 'messages',
  'timeline_events', 'invoices', 'audit_log', 'nda_records',
  'todo', 'signature_requests', 'notifications', 'site_content',
] as const;

export async function POST(request: Request) {
  /* Block in production */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Migrate endpoint is disabled in production' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== 'jr-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  /* Check each table */
  const results: Record<string, 'ok' | 'missing' | string> = {};
  const missing: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const { error } = await sb.from(table).select('id').limit(0);
    if (!error) {
      results[table] = 'ok';
    } else if (error.code === '42P01' || error.message.includes('does not exist')) {
      results[table] = 'missing';
      missing.push(table);
    } else {
      results[table] = `error: ${error.message}`;
    }
  }

  if (missing.length === 0) {
    return NextResponse.json({ status: 'ok', message: 'All tables exist ✓', tables: results });
  }

  return NextResponse.json({
    status: 'action_required',
    message: `${missing.length} table(s) missing. Run supabase/migrations/002_missing_tables.sql in the SQL Editor.`,
    missing,
    tables: results,
    sql_file: 'supabase/migrations/002_missing_tables.sql',
  });
}

export async function GET() {
  return NextResponse.json({ message: 'POST /api/migrate?key=jr-migrate-2026' });
}
