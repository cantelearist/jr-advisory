/* ── Auth Callback — handles magic link + invite redirects ── */
/* P3: Added redirect URL sanitization to prevent open-redirect attacks. */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
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
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Let the portal middleware resolve the destination from the trusted
      // profile and enforce MFA. Never route by user-editable metadata here.
      return NextResponse.redirect(new URL('/portal', origin));
    }
  }

  // Fallback: auth error or no code → login page with error
  return NextResponse.redirect(
    new URL('/portal?error=auth_callback_failed', origin)
  );
}
