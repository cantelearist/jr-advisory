/* ── Cleanup diagnostic test users ── */
/* POST /api/fix-trigger?key=jr-fix-2026 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const FIX_KEY = 'jr-fix-2026';

export async function POST(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (key !== FIX_KEY) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  // List all users and clean up test accounts
  const { data: allUsers } = await sb.auth.admin.listUsers();
  const testEmails = ['diag-norole@test.com', 'diag-client@test.com', 'diag-bare@test.com', 'trigger-verify@test.com'];

  if (allUsers?.users) {
    for (const user of allUsers.users) {
      if (testEmails.includes(user.email || '') || (user.email || '').includes('test.com')) {
        await sb.from('profiles').delete().eq('id', user.id);
        const { error } = await sb.auth.admin.deleteUser(user.id);
        results.push(`Deleted test user: ${user.email} ${error ? '❌ ' + error.message : '✅'}`);
      } else {
        results.push(`Kept: ${user.email} (${user.user_metadata?.role || 'no-role'})`);
      }
    }
  }

  // Verify profiles
  const { data: profiles, error: profErr } = await sb.from('profiles').select('id, full_name, email, role');
  results.push(`\nProfiles: ${profErr ? profErr.message : `${profiles?.length || 0} rows`}`);
  if (profiles) {
    for (const p of profiles) {
      results.push(`  ${p.email} — ${p.full_name} (${p.role})`);
    }
  }

  return NextResponse.json({ success: true, results });
}
