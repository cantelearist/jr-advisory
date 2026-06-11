/* ── Auth Setup — Create admin + client accounts ── */
/* POST /api/auth/setup */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isInternalSecretAuthorized } from '@/lib/internal-secret';

const ADMIN_ACCOUNTS = [
  { email: 'roman@jamesroman.la', full_name: 'Roman' },
  { email: 'stephen@jamesroman.la', full_name: 'Stephen' },
];

export async function POST(req: NextRequest) {
  /* Block in production */
  if (process.env.VERCEL_ENV === 'production') {
    return NextResponse.json({ error: 'Disabled in production' }, { status: 403 });
  }

  const key = req.nextUrl.searchParams.get('key');
  if (!isInternalSecretAuthorized(key, process.env.AUTH_SETUP_SECRET)) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 403 });
  }

  const adminPassword = process.env.AUTH_SETUP_ADMIN_PASSWORD;
  const clientPassword = process.env.AUTH_SETUP_CLIENT_PASSWORD;
  if (!adminPassword || !clientPassword) {
    return NextResponse.json({ error: 'Auth setup passwords not configured' }, { status: 503 });
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const results: { admins: string[]; clients: string[]; errors: string[] } = {
    admins: [],
    clients: [],
    errors: [],
  };

  // ── Create admin accounts ──
  for (const acct of ADMIN_ACCOUNTS) {
    try {
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find(
        (u) => u.email === acct.email
      );

      if (existing) {
        await admin.auth.admin.updateUserById(existing.id, {
          password: adminPassword,
          user_metadata: { full_name: acct.full_name, role: 'admin' },
        });
        await admin
          .from('profiles')
          .upsert(
            { id: existing.id, full_name: acct.full_name, email: acct.email, role: 'admin' },
            { onConflict: 'id' }
          );
        results.admins.push(`${acct.email} (updated)`);
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: acct.email,
          password: adminPassword,
          email_confirm: true,
          user_metadata: { full_name: acct.full_name, role: 'admin' },
        });
        if (error) throw error;
        // Manually insert profile (trigger is disabled)
        const { error: profileErr } = await admin
          .from('profiles')
          .upsert(
            { id: data.user.id, full_name: acct.full_name, email: acct.email, role: 'admin' },
            { onConflict: 'id' }
          );
        if (profileErr) {
          results.errors.push(`Profile for ${acct.email}: ${profileErr.message}`);
        }
        results.admins.push(`${acct.email} (created)`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      results.errors.push(`Admin ${acct.email}: ${msg}`);
    }
  }

  // ── Create client accounts + link profile_id ──
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, email')
    .order('created_at');

  if (clients) {
    for (const client of clients) {
      try {
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const existing = existingUsers?.users?.find(
          (u) => u.email === client.email
        );

        let userId: string;

        if (existing) {
          userId = existing.id;
          await admin.auth.admin.updateUserById(userId, {
            password: clientPassword,
            user_metadata: { full_name: client.name, role: 'client' },
          });
          await admin
            .from('profiles')
            .upsert(
              { id: userId, full_name: client.name, email: client.email, role: 'client' },
              { onConflict: 'id' }
            );
          results.clients.push(`${client.email} (updated)`);
        } else {
          const { data, error } = await admin.auth.admin.createUser({
            email: client.email,
            password: clientPassword,
            email_confirm: true,
            user_metadata: { full_name: client.name, role: 'client' },
          });
          if (error) throw error;
          userId = data.user!.id;
          // Manually insert profile (trigger is disabled)
          const { error: profileErr } = await admin
            .from('profiles')
            .upsert(
              { id: userId, full_name: client.name, email: client.email, role: 'client' },
              { onConflict: 'id' }
            );
          if (profileErr) {
            results.errors.push(`Profile for ${client.email}: ${profileErr.message}`);
          }
          results.clients.push(`${client.email} (created)`);
        }

        // Link profile to client record
        await admin
          .from('clients')
          .update({ profile_id: userId })
          .eq('id', client.id);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        results.errors.push(`Client ${client.email}: ${msg}`);
      }
    }
  }

  return NextResponse.json(results);
}
