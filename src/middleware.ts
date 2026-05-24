/* ── Next.js Middleware — Auth gate for /portal/* ── */
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session (important — keeps the cookie alive)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // ── Login page: redirect authenticated users to their home ──
  if (path === '/portal' && user) {
    const role = user.user_metadata?.role || 'client';
    const dest = role === 'admin' ? '/portal/admin' : '/portal/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // ── Protected pages: require authentication ──
  if (path.startsWith('/portal/') && !user) {
    const loginUrl = new URL('/portal', request.url);
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/portal', '/portal/:path*'],
};
