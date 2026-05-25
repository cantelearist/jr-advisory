/* ── POST /api/migrate?key=jr-migrate-2026 — Create missing tables via Supabase Management API ── */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const dbPassword = process.env.SUPABASE_DB_PASSWORD || '';

function getProjectRef(): string {
  // Extract project ref from URL: https://xxxxx.supabase.co
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match ? match[1] : '';
}

async function runSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  const projectRef = getProjectRef();
  if (!projectRef) return { success: false, error: 'Cannot determine project ref' };

  // Try Supabase Management API (requires service role key as bearer)
  // This endpoint runs arbitrary SQL
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) return { success: true };

  // Fallback: try direct PostgreSQL REST endpoint
  // PostgREST doesn't support DDL, so try the pg_net extension or return SQL for manual execution
  const text = await res.text();
  
  // If exec_sql doesn't exist, try creating it first then retry
  if (text.includes('Could not find the function') || text.includes('does not exist')) {
    // Create exec_sql function isn't possible without DDL access
    // Return SQL for manual execution
    return { success: false, error: `exec_sql RPC not available. ${text}` };
  }

  return { success: false, error: text };
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');
  if (key !== 'jr-migrate-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const { createClient } = await import('@supabase/supabase-js');
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Check if todos table exists
  const { error: checkErr } = await sb.from('todos').select('id').limit(1);
  const todosMissing = checkErr && (checkErr.message.includes('does not exist') || checkErr.code === '42P01');

  if (!todosMissing) {
    return NextResponse.json({ status: 'ok', message: 'All tables exist ✓' });
  }

  // Try to create via RPC
  const sql = `
    CREATE TABLE IF NOT EXISTS public.todos (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      client_id uuid REFERENCES public.clients(id) ON DELETE CASCADE,
      engagement_id uuid REFERENCES public.engagements(id) ON DELETE SET NULL,
      assigned_to uuid,
      title text NOT NULL,
      description text,
      priority text NOT NULL DEFAULT 'normal',
      status text NOT NULL DEFAULT 'pending',
      due_date date,
      completed_at timestamptz,
      visible_to_client boolean DEFAULT false,
      created_by uuid,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role bypass todos" ON public.todos FOR ALL USING (auth.role() = 'service_role');
  `;

  const result = await runSQL(sql);
  if (result.success) {
    return NextResponse.json({ status: 'ok', message: 'todos table created ✓' });
  }

  // Manual fallback
  return NextResponse.json({
    status: 'manual_action_required',
    message: 'Cannot run DDL via API. Please run this SQL in the Supabase SQL Editor:',
    sql: sql.trim(),
    error: result.error,
  });
}

export async function GET() {
  return NextResponse.json({ message: 'POST /api/migrate?key=jr-migrate-2026' });
}
