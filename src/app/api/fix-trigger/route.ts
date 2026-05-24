/* ── Fix Auth Trigger — One-time DB migration ── */
/* POST /api/fix-trigger?key=jr-fix-2026 */

import { NextResponse, type NextRequest } from 'next/server';
import postgres from 'postgres';

const FIX_KEY = 'jr-fix-2026';

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== FIX_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
  }

  const sql = postgres(databaseUrl, { ssl: 'require' });
  const results: string[] = [];

  try {
    // 1) Check existing triggers
    const triggers = await sql`
      SELECT trigger_name, event_manipulation, action_statement
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    `;
    results.push(`Found ${triggers.length} existing trigger(s)`);
    for (const t of triggers) {
      results.push(`  - ${t.trigger_name} (${t.event_manipulation})`);
    }

    // 2) Check existing function
    const funcs = await sql`
      SELECT routine_name, routine_schema
      FROM information_schema.routines
      WHERE routine_name = 'handle_new_user'
    `;
    results.push(`Found ${funcs.length} existing function(s)`);

    // 3) Drop broken trigger and function
    await sql`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users`;
    results.push('Dropped trigger on_auth_user_created (if existed)');

    await sql`DROP FUNCTION IF EXISTS public.handle_new_user()`;
    results.push('Dropped function handle_new_user (if existed)');

    // 4) Create correct trigger function
    await sql.unsafe(`
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
          COALESCE(NEW.raw_user_meta_data->>'role', 'client')
        )
        ON CONFLICT (id) DO UPDATE SET
          full_name = EXCLUDED.full_name,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          updated_at = now();
        RETURN NEW;
      END;
      $$;
    `);
    results.push('✅ Created handle_new_user() function');

    // 5) Create trigger
    await sql.unsafe(`
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    results.push('✅ Created on_auth_user_created trigger');

    // 6) Verify
    const newTriggers = await sql`
      SELECT trigger_name, event_manipulation
      FROM information_schema.triggers
      WHERE event_object_schema = 'auth' AND event_object_table = 'users'
    `;
    results.push(`Verified: ${newTriggers.length} trigger(s) on auth.users`);
    for (const t of newTriggers) {
      results.push(`  ✅ ${t.trigger_name} (${t.event_manipulation})`);
    }

    await sql.end();
    return NextResponse.json({ success: true, results });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    results.push(`ERROR: ${msg}`);
    try { await sql.end(); } catch {}
    return NextResponse.json({ success: false, results, error: msg }, { status: 500 });
  }
}
