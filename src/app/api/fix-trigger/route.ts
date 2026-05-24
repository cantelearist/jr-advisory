/* ── Fix Auth Trigger — tries direct DB + pooler + fallback diagnosis ── */
/* POST /api/fix-trigger?key=jr-fix-2026 */

import { NextResponse, type NextRequest } from 'next/server';
import postgres from 'postgres';
import { createClient } from '@supabase/supabase-js';

const FIX_KEY = 'jr-fix-2026';

const TRIGGER_SQL = `
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
      COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
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

const RECREATE_TRIGGER_SQL = `
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
`;

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== FIX_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'Racemachinerm01';
  const projectRef = 'sefelsnpkgxarinswkxh';
  const results: string[] = [];

  // Try multiple connection methods
  const urls = [
    { label: 'Direct IPv6', url: `postgres://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres` },
    { label: 'Pooler session (5432)', url: `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:5432/postgres` },
    { label: 'Pooler tx (6543)', url: `postgres://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:6543/postgres` },
  ];

  for (const { label, url } of urls) {
    results.push(`\n--- Trying: ${label} ---`);
    const sql = postgres(url, { ssl: 'require', connect_timeout: 10, idle_timeout: 5 });
    try {
      // Simple connectivity test
      const rows = await sql`SELECT current_database() as db, current_user as usr`;
      results.push(`✅ Connected: db=${rows[0].db}, user=${rows[0].usr}`);

      // Drop and recreate the function
      await sql.unsafe(TRIGGER_SQL);
      results.push('✅ Created handle_new_user() function');

      await sql.unsafe(RECREATE_TRIGGER_SQL);
      results.push('✅ Recreated trigger on auth.users');

      // Verify
      const triggers = await sql`
        SELECT trigger_name FROM information_schema.triggers
        WHERE event_object_schema = 'auth' AND event_object_table = 'users'
      `;
      results.push(`Verified: ${triggers.length} trigger(s) on auth.users`);

      await sql.end();

      // Now test createUser
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
      const sb = createClient(supabaseUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: testUser, error: testErr } = await sb.auth.admin.createUser({
        email: 'trigger-verify@test.com',
        password: 'TriggerTest123!',
        email_confirm: true,
        user_metadata: { full_name: 'Trigger Verify', role: 'client' }
      });

      if (testErr) {
        results.push(`⚠️ createUser still fails: ${testErr.message}`);
      } else {
        results.push(`✅ createUser works! user=${testUser.user.id}`);
        // Check profile
        const { data: profile } = await sb.from('profiles').select('*').eq('id', testUser.user.id).single();
        results.push(`Profile: ${profile ? `✅ ${profile.full_name} (${profile.role})` : '❌ trigger did not create profile'}`);
        // Cleanup
        await sb.from('profiles').delete().eq('id', testUser.user.id);
        await sb.auth.admin.deleteUser(testUser.user.id);
        results.push('Cleanup: ok');
      }

      return NextResponse.json({ success: true, method: label, results });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`❌ ${msg}`);
      try { await sql.end(); } catch {}
    }
  }

  return NextResponse.json({ success: false, results, error: 'All connection methods failed' }, { status: 500 });
}
