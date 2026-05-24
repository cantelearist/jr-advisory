/* ── Fix Auth Trigger — diagnostic version ── */
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
  const results: string[] = [];

  results.push(`URL: ${supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'MISSING'}`);
  results.push(`Key: ${serviceKey ? serviceKey.substring(0, 20) + '... (len=' + serviceKey.length + ')' : 'MISSING'}`);

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Env vars missing', results }, { status: 500 });
  }

  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Step 1: Simple query test
  try {
    const { data, error } = await sb.from('clients').select('id').limit(1);
    results.push(`Step 1 (query clients): ${error ? error.message : `ok (${data?.length} rows)`}`);
  } catch (e: unknown) {
    results.push(`Step 1 EXCEPTION: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 2: Test profiles table
  try {
    const { data, error } = await sb.from('profiles').select('id').limit(1);
    results.push(`Step 2 (query profiles): ${error ? error.message : `ok (${data?.length} rows)`}`);
  } catch (e: unknown) {
    results.push(`Step 2 EXCEPTION: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 3: Test insert into profiles
  try {
    const testId = '00000000-0000-4000-a000-000000000099';
    const { error: insErr } = await sb.from('profiles').upsert({
      id: testId,
      full_name: 'Trigger Test',
      email: 'trigger-test@test.com',
      role: 'client'
    });
    results.push(`Step 3 (upsert profile): ${insErr ? insErr.message : 'ok'}`);
    if (!insErr) {
      await sb.from('profiles').delete().eq('id', testId);
      results.push('Step 3 cleanup: ok');
    }
  } catch (e: unknown) {
    results.push(`Step 3 EXCEPTION: ${e instanceof Error ? e.message : String(e)}`);
  }

  // Step 4: Test createUser (the thing that's broken)
  try {
    const { data: userData, error: userErr } = await sb.auth.admin.createUser({
      email: 'trigger-diag-test@test.com',
      password: 'DiagTest123!',
      email_confirm: true,
      user_metadata: { full_name: 'Diag Test', role: 'client' }
    });
    results.push(`Step 4 (createUser): ${userErr ? userErr.message : `ok (id=${userData?.user?.id})`}`);
    
    if (userData?.user?.id) {
      // Check if trigger created a profile
      const { data: profile } = await sb.from('profiles').select('*').eq('id', userData.user.id).single();
      results.push(`Step 4b (trigger profile): ${profile ? `found (${profile.full_name})` : 'NOT FOUND — trigger broken'}`);
      
      // Cleanup
      await sb.from('profiles').delete().eq('id', userData.user.id);
      await sb.auth.admin.deleteUser(userData.user.id);
      results.push('Step 4 cleanup: ok');
    }
  } catch (e: unknown) {
    results.push(`Step 4 EXCEPTION: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ success: true, results });
}
