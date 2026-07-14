import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { middleware } from '@/middleware';

const getUserMock = vi.hoisted(() => vi.fn());
const getAalMock = vi.hoisted(() => vi.fn());
const profileMaybeSingleMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      mfa: {
        getAuthenticatorAssuranceLevel: getAalMock,
      },
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: profileMaybeSingleMock,
        }),
      }),
    }),
  })),
}));

function portalRequest(path: string) {
  return new NextRequest(`https://www.jamesroman.la${path}`);
}

function authenticatedPortalRequest(path: string) {
  return new NextRequest(`https://www.jamesroman.la${path}`, {
    headers: {
      cookie: 'sb-example-auth-token=%5B%5D',
    },
  });
}

describe('portal middleware admin access', () => {
  afterEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    profileMaybeSingleMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('serves the public login page without waiting on Supabase', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const response = await middleware(portalRequest('/portal'));

    expect(response.status).toBe(200);
    expect(getUserMock).not.toHaveBeenCalled();
  });

  it('still redirects an authenticated client from the login page', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'client-1' } },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({
      data: { role: 'client' },
      error: null,
    });

    const response = await middleware(authenticatedPortalRequest('/portal'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.jamesroman.la/portal/dashboard');
  });

  it('redirects authenticated clients away from the admin route before serving it', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'client-1',
          user_metadata: { role: 'client' },
        },
      },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({
      data: { role: 'client' },
      error: null,
    });

    const response = await middleware(authenticatedPortalRequest('/portal/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://www.jamesroman.la/portal/dashboard');
  });

  it('redirects an unenrolled profile-backed admin to MFA enrollment', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'admin-1',
          user_metadata: { role: 'client' },
        },
      },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });
    getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const response = await middleware(authenticatedPortalRequest('/portal/admin'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://www.jamesroman.la/portal/mfa?redirect=%2Fportal%2Fadmin',
    );
  });

  it('allows profile-backed admins with an aal2 session', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-1' } },
    });
    profileMaybeSingleMock.mockResolvedValueOnce({
      data: { role: 'admin' },
      error: null,
    });
    getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const response = await middleware(authenticatedPortalRequest('/portal/admin'));

    expect(response.status).toBe(200);
    expect(response.headers.get('location')).toBeNull();
  });
});
