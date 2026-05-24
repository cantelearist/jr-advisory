/* ── Deep Auth Trigger Diagnostic ── */
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
  const sb = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const results: string[] = [];

  // 1. Check profiles table columns via a dummy query
  try {
    const { data, error } = await sb.from('profiles').select('*').limit(0);
    results.push(`profiles table: ${error ? error.message : 'exists'}`);
    // The select('*').limit(0) won't give us column info, but checking error
  } catch (e: unknown) {
    results.push(`profiles check error: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 2. Try to list enum values via pg_enum (if accessible through PostgREST)
  // We can check by trying to insert with known role values
  const roles = ['client', 'admin', 'owner', 'viewer'];
  for (const role of roles) {
    try {
      const testId = `00000000-0000-4000-a000-00000000aa${role.substring(0, 2)}`;
      // This will fail with FK constraint but we can see if the role value is valid
      const { error } = await sb.from('profiles').insert({
        id: testId,
        full_name: 'Test',
        email: `test-${role}@test.com`,
        role: role
      });
      if (error) {
        // FK error means role value was accepted, something else blocked it
        if (error.message.includes('foreign key')) {
          results.push(`role '${role}': ✅ valid (FK blocked insert as expected)`);
        } else if (error.message.includes('invalid input value')) {
          results.push(`role '${role}': ❌ invalid enum value`);
        } else {
          results.push(`role '${role}': error: ${error.message}`);
        }
      } else {
        results.push(`role '${role}': ✅ inserted (unexpected — cleaning up)`);
        await sb.from('profiles').delete().eq('id', testId);
      }
    } catch (e: unknown) {
      results.push(`role '${role}' exception: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // 3. Try createUser with minimal metadata (no role)
  try {
    const { data, error } = await sb.auth.admin.createUser({
      email: 'diag-norole@test.com',
      password: 'DiagTest123!',
      email_confirm: true,
      user_metadata: { full_name: 'No Role Test' }
    });
    results.push(`createUser (no role): ${error ? error.message : `✅ id=${data.user.id}`}`);
    if (data?.user?.id) {
      const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
      results.push(`profile created by trigger: ${profile ? JSON.stringify(profile) : 'NOT FOUND'}`);
      await sb.from('profiles').delete().eq('id', data.user.id);
      await sb.auth.admin.deleteUser(data.user.id);
    }
  } catch (e: unknown) {
    results.push(`createUser (no role) exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 4. Try createUser with role='client' explicitly
  try {
    const { data, error } = await sb.auth.admin.createUser({
      email: 'diag-client@test.com',
      password: 'DiagTest123!',
      email_confirm: true,
      user_metadata: { full_name: 'Client Role Test', role: 'client' }
    });
    results.push(`createUser (role=client): ${error ? error.message : `✅ id=${data.user.id}`}`);
    if (data?.user?.id) {
      const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
      results.push(`profile: ${profile ? JSON.stringify(profile) : 'NOT FOUND'}`);
      await sb.from('profiles').delete().eq('id', data.user.id);
      await sb.auth.admin.deleteUser(data.user.id);
    }
  } catch (e: unknown) {
    results.push(`createUser (role=client) exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 5. Try createUser with NO user_metadata at all
  try {
    const { data, error } = await sb.auth.admin.createUser({
      email: 'diag-bare@test.com',
      password: 'DiagTest123!',
      email_confirm: true,
    });
    results.push(`createUser (bare): ${error ? error.message : `✅ id=${data.user.id}`}`);
    if (data?.user?.id) {
      const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
      results.push(`profile: ${profile ? JSON.stringify(profile) : 'NOT FOUND'}`);
      await sb.from('profiles').delete().eq('id', data.user.id);
      await sb.auth.admin.deleteUser(data.user.id);
    }
  } catch (e: unknown) {
    results.push(`createUser (bare) exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 6. Check if trigger function exists by trying to call it (won't work but error reveals info)
  try {
    const { error } = await sb.rpc('handle_new_user');
    results.push(`rpc handle_new_user: ${error ? error.message : 'unexpected success'}`);
  } catch (e: unknown) {
    results.push(`rpc handle_new_user: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 7. Check information_schema for profiles columns
  try {
    const { data, error } = await sb.from('information_schema.columns' as string)
      .select('column_name,data_type,udt_name,is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'profiles');
    results.push(`profiles columns: ${error ? error.message : JSON.stringify(data)}`);
  } catch (e: unknown) {
    results.push(`profiles columns: ${e instanceof Error ? e.message : String(e)}`);
  }

  return NextResponse.json({ success: true, results });
}
