/* ── Portal Data API — authenticated client data endpoint ── */
/* Bypasses RLS by using service role key after verifying user session */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const response = NextResponse.next();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return req.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get profile
  const { data: profile } = await sb.from('profiles').select('*').eq('id', user.id).single();
  const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin';

  // Determine client ID
  let clientRecord = null;
  let clientId = req.nextUrl.searchParams.get('client_id');

  if (!isAdmin) {
    const { data: cli } = await sb.from('clients').select('*').eq('profile_id', user.id).single();
    clientRecord = cli;
    clientId = cli?.id || null;
  }

  if (!clientId) {
    return NextResponse.json({
      profile, isAdmin, client: null, engagement: null,
      documents: [], messages: [], timeline: [], invoices: [], todos: [],
    });
  }

  const [
    { data: engagement },
    { data: documents },
    { data: messages },
    { data: invoices },
    { data: todos },
  ] = await Promise.all([
    sb.from('engagements').select('*').eq('client_id', clientId).order('created_at', { ascending: false }).limit(1).single(),
    sb.from('documents').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('messages').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('invoices').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    sb.from('todo').select('*').eq('client_id', clientId).eq('visible_to_client', true).neq('status', 'done').order('priority', { ascending: true }),
  ]);

  let timeline: unknown[] = [];
  if (engagement) {
    const { data: events } = await sb.from('timeline_events').select('*').eq('engagement_id', engagement.id).order('event_date', { ascending: true });
    timeline = events || [];
  }

  return NextResponse.json({
    profile, isAdmin,
    client: clientRecord || null,
    engagement: engagement || null,
    documents: documents || [],
    messages: messages || [],
    timeline,
    invoices: invoices || [],
    todos: todos || [],
  });
}
