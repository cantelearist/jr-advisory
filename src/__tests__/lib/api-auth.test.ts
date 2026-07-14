import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { requireAdmin } from '@/lib/api-auth';

const getUserMock = vi.hoisted(() => vi.fn());
const getAalMock = vi.hoisted(() => vi.fn());
const profileSingleMock = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({
    auth: {
      getUser: getUserMock,
      mfa: {
        getAuthenticatorAssuranceLevel: getAalMock,
      },
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: profileSingleMock,
        }),
      }),
    }),
  })),
}));

function apiRequest() {
  return new NextRequest('https://www.jamesroman.la/api/admin');
}

describe('requireAdmin', () => {
  afterEach(() => {
    getUserMock.mockReset();
    getAalMock.mockReset();
    profileSingleMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('does not grant admin access from user_metadata when the profile is a client', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    getUserMock.mockResolvedValueOnce({
      data: {
        user: {
          id: 'client-1',
          email: 'client@jamesroman.la',
          user_metadata: { role: 'admin' },
        },
      },
    });
    profileSingleMock.mockResolvedValueOnce({
      data: {
        id: 'client-1',
        role: 'client',
        full_name: 'Client',
        email: 'client@jamesroman.la',
      },
    });
    getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
    });

    const result = await requireAdmin(apiRequest());

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
    await expect((result as NextResponse).json()).resolves.toEqual({
      error: 'Admin access required',
    });
  });

  it('rejects an administrator who has not enrolled and verified MFA', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@jamesroman.la' } },
    });
    profileSingleMock.mockResolvedValueOnce({
      data: {
        id: 'admin-1',
        role: 'admin',
        full_name: 'Administrator',
        email: 'admin@jamesroman.la',
      },
    });
    getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal1', nextLevel: 'aal1' },
      error: null,
    });

    const result = await requireAdmin(apiRequest());

    expect(result).toBeInstanceOf(NextResponse);
    expect((result as NextResponse).status).toBe(403);
    await expect((result as NextResponse).json()).resolves.toEqual({
      error: 'MFA enrollment and verification required',
    });
  });

  it('allows a profile-backed administrator with an aal2 session', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key');
    getUserMock.mockResolvedValueOnce({
      data: { user: { id: 'admin-1', email: 'admin@jamesroman.la' } },
    });
    profileSingleMock.mockResolvedValueOnce({
      data: {
        id: 'admin-1',
        role: 'admin',
        full_name: 'Administrator',
        email: 'admin@jamesroman.la',
      },
    });
    getAalMock.mockResolvedValueOnce({
      data: { currentLevel: 'aal2', nextLevel: 'aal2' },
      error: null,
    });

    const result = await requireAdmin(apiRequest());

    expect(result).not.toBeInstanceOf(NextResponse);
    expect((result as { isAdmin: boolean }).isAdmin).toBe(true);
  });
});
