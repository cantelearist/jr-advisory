/* ── Invite Client — Admin creates auth account for a client ── */
/* POST /api/auth/invite { clientId, password? } */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  // Verify the caller is an authenticated admin
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* server component */
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 });
  }

  const body = await req.json();
  const { clientId, password } = body;

  if (!clientId) {
    return NextResponse.json(
      { error: 'clientId required' },
      { status: 400 }
    );
  }

  // Admin client for user creation
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get client record
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, profile_id')
    .eq('id', clientId)
    .single();

  if (!client) {
    return NextResponse.json(
      { error: 'Client not found' },
      { status: 404 }
    );
  }

  // Check if client already has an account
  if (client.profile_id) {
    return NextResponse.json({
      message: 'Client already has an account',
      profile_id: client.profile_id,
    });
  }

  // Create auth user
  const clientPassword = password || `jr-${client.name.split(' ')[0].toLowerCase()}-2026`;
  try {
    const { data: newUser, error } = await admin.auth.admin.createUser({
      email: client.email,
      password: clientPassword,
      email_confirm: true,
      user_metadata: {
        full_name: client.name,
        role: 'client',
      },
    });

    if (error) throw error;

    // Link profile to client
    await admin
      .from('clients')
      .update({ profile_id: newUser.user!.id })
      .eq('id', clientId);

    return NextResponse.json({
      success: true,
      email: client.email,
      password: clientPassword,
      message: `Account created for ${client.name}. Share credentials securely.`,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
