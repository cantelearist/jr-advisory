/* ── Temporary: create test users with confirmed emails ── */
/* DELETE THIS FILE after use */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInternalSecretAuthorized } from '@/lib/internal-secret';

const USERS = [
  { email: 'admin@jamesroman.la', password: '111111', role: 'admin', full_name: 'Admin' },
  { email: 'user@jamesroman.la', password: '111111', role: 'client', full_name: 'Test User' },
];

export async function POST(req: NextRequest) {
  /* Block in production — test user creation should never run against live data */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (!isInternalSecretAuthorized(key, process.env.TEST_USERS_SETUP_SECRET)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: string[] = [];

  for (const u of USERS) {
    try {
      // Check if user exists
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users?.find((x) => x.email === u.email);

      if (existing) {
        // Update existing user
        await admin.auth.admin.updateUserById(existing.id, {
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role },
        });
        await admin.from('profiles').upsert(
          { id: existing.id, full_name: u.full_name, email: u.email, role: u.role },
          { onConflict: 'id' }
        );
        results.push(`${u.email} (updated + confirmed)`);
      } else {
        // Create new user
        const { data, error } = await admin.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { full_name: u.full_name, role: u.role },
        });
        if (error) throw error;
        await admin.from('profiles').upsert(
          { id: data.user.id, full_name: u.full_name, email: u.email, role: u.role },
          { onConflict: 'id' }
        );
        results.push(`${u.email} (created + confirmed)`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push(`${u.email}: ERROR — ${msg}`);
    }
  }

  return NextResponse.json({ results });
}
