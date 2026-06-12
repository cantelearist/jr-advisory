/* ── Next.js Middleware — Auth + MFA gate for /portal/* ──
 *
 * 1. Refreshes session cookies on every request.
 * 2. Redirects unauthenticated users to /portal login.
 * 3. Redirects authenticated users away from /portal login.
 * 4. Enforces MFA for admin/manager — no fail-open.
 *    If TOTP is enrolled, AAL must be aal2 or user goes to /portal/mfa.
 * 5. Validates redirect URLs to prevent open-redirect attacks. (P3)
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { privateSurfaceHeaders, withPrivateHeaders } from '@/lib/security-headers';

/* Pages that don't require MFA verification */
const MFA_EXEMPT_PATHS = [
  '/portal',                    // login page itself
  '/portal/mfa',                // MFA verification page
  '/portal/forgot-password',
  '/portal/reset-password',
];

/**
 * Sanitize a redirect URL — must be a relative path starting with /
 * and not a protocol-relative URL (//).
 */
function sanitizeRedirect(url: string | null, fallback: string): string {
  if (!url) return fallback;
  const cleaned = url.trim();
  if (!cleaned.startsWith('/') || cleaned.startsWith('//')) return fallback;
  return cleaned;
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('middleware.supabase_not_configured');
    return new NextResponse('Private office is temporarily unavailable.', {
      status: 503,
      headers: Object.fromEntries(privateSurfaceHeaders.map(({ key, value }) => [key, value])),
    });
  }

  const nextResponse = () => withPrivateHeaders(NextResponse.next({ request }));
  const redirect = (url: URL) => withPrivateHeaders(NextResponse.redirect(url));

  let response = nextResponse();

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options?: Record<string, unknown>;
            }[],
          ) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            response = nextResponse();
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    // Refresh session (important — keeps the cookie alive)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ── Login page: redirect authenticated users to their home ──
    if (path === '/portal' && user) {
      const role = user.user_metadata?.role || 'client';
      const isPrivileged = role === 'admin' || role === 'manager';

      // If privileged and has MFA enrolled, check AAL
      if (isPrivileged) {
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (
          aal?.currentLevel === 'aal1' &&
          aal?.nextLevel === 'aal2'
        ) {
          // MFA enrolled but not yet verified this session — send to MFA page
          const dest = role === 'admin' ? '/portal/admin' : '/portal/dashboard';
          return redirect(
            new URL(`/portal/mfa?redirect=${encodeURIComponent(dest)}`, request.url),
          );
        }
      }

      const dest = isPrivileged ? '/portal/admin' : '/portal/dashboard';
      return redirect(new URL(dest, request.url));
    }

    // ── Protected pages: require authentication ──
    if (path.startsWith('/portal/') && !user) {
      // Allow forgot-password and reset-password without auth
      if (
        path === '/portal/forgot-password' ||
        path === '/portal/reset-password'
      ) {
        return response;
      }

      const loginUrl = new URL('/portal', request.url);
      // Only pass sanitized path as redirect (path is always from nextUrl.pathname, which is safe)
      loginUrl.searchParams.set('redirect', path);
      return redirect(loginUrl);
    }

    // ── MFA enforcement for admin/manager — NO FAIL-OPEN ──
    if (
      user &&
      path.startsWith('/portal/') &&
      !MFA_EXEMPT_PATHS.includes(path)
    ) {
      const role = user.user_metadata?.role || 'client';
      const isPrivileged = role === 'admin' || role === 'manager';

      if (isPrivileged) {
        const { data: aal } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        // If MFA is enrolled (nextLevel === 'aal2') but not verified (currentLevel !== 'aal2')
        // → redirect to MFA verification. This is the no-fail-open gate.
        if (
          aal?.nextLevel === 'aal2' &&
          aal?.currentLevel !== 'aal2'
        ) {
          return redirect(
            new URL(
              `/portal/mfa?redirect=${encodeURIComponent(path)}`,
              request.url,
            ),
          );
        }
      }
    }

    return response;
  } catch (error) {
    console.error('middleware.auth_failed', error);
    return new NextResponse('Private office is temporarily unavailable.', {
      status: 503,
      headers: Object.fromEntries(privateSurfaceHeaders.map(({ key, value }) => [key, value])),
    });
  }
}

export const config = {
  matcher: ['/portal', '/portal/:path*'],
};
