/* ── Fix Auth Trigger — uses Supabase Management API or JS client ── */
/* POST /api/fix-trigger?key=jr-fix-2026 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FIX_KEY = 'jr-fix-2026';

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== FIX_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase env vars missing' }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const results: string[] = [];

  try {
    // 1. Check if profiles table works — try direct insert
    const testId = '00000000-0000-0000-0000-000000000099';
    const { error: delErr } = await sb.from('profiles').delete().eq('id', testId);
    results.push(`Delete test profile: ${delErr ? delErr.message : 'ok'}`);

    const { error: insErr } = await sb.from('profiles').insert({
      id: testId,
      full_name: 'Test User',
      email: 'test-trigger-check@test.com',
      role: 'client'
    });
    results.push(`Insert test profile: ${insErr ? insErr.message : 'ok'}`);

    // Clean up
    if (!insErr) {
      await sb.from('profiles').delete().eq('id', testId);
      results.push('Cleaned up test profile');
    }

    // 2. Use the SQL via rpc — try creating a helper function first
    // Execute raw SQL through Supabase's built-in functions
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (
          NEW.id,
          COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
          COALESCE(NEW.email, ''),
          COALESCE(NEW.raw_user_meta_data->>'role', 'client')::user_role
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          updated_at = now();
        RETURN NEW;
      END;
      $$;
    `;

    // Try using the Supabase REST API to call exec_sql if available
    // The service role key allows calling pg functions via rpc
    const { data: rpcData, error: rpcErr } = await sb.rpc('exec_sql', { sql: triggerSQL });
    if (rpcErr) {
      results.push(`RPC exec_sql not available: ${rpcErr.message}`);

      // Alternative: try using supabase-js's .rpc with pgmq or built-in
      // Actually, let's try creating a temp function to execute our SQL
      const { error: createExecErr } = await sb.rpc('query', { query_text: triggerSQL });
      if (createExecErr) {
        results.push(`RPC query not available: ${createExecErr.message}`);
      }
    } else {
      results.push(`exec_sql result: ${JSON.stringify(rpcData)}`);
    }

    // 3. Try the admin.createUser without the trigger and see exact error
    const { data: testUser, error: createErr } = await sb.auth.admin.createUser({
      email: 'trigger-test-xyz@test.com',
      password: 'TriggerTest123!',
      email_confirm: true,
      user_metadata: { full_name: 'Trigger Test', role: 'client' }
    });
    results.push(`Create test user: ${createErr ? createErr.message : `ok (${testUser?.user?.id})`}`);

    // Clean up test user if created
    if (testUser?.user?.id) {
      await sb.auth.admin.deleteUser(testUser.user.id);
      results.push('Cleaned up test user');
      // Also clean up the profile if trigger worked
      await sb.from('profiles').delete().eq('id', testUser.user.id);
    }

    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(`ERROR: ${msg}`);
    return NextResponse.json({ success: false, results, error: msg }, { status: 500 });
  }
}
