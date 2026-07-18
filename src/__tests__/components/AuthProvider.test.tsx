import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/components/portal/AuthProvider';

const getAuthClientMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/supabase-browser', () => ({
  getAuthClient: getAuthClientMock,
}));

function makeSupabaseClient({
  setSession = vi.fn().mockResolvedValue({ data: {}, error: null }),
} = {}) {
  const user = {
    id: 'user-1',
    app_metadata: { role: 'client' },
    user_metadata: {},
  };

  return {
    auth: {
      setSession,
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user } },
        error: null,
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signOut: vi.fn(),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({
            data: table === 'profiles'
              ? { id: 'user-1', role: 'client', full_name: 'Client' }
              : { id: 'client-1', profile_id: 'user-1' },
            error: null,
          }),
        })),
      })),
    })),
  };
}

function AuthProbe() {
  const { loading, user, clientRecord } = useAuth();
  return (
    <div>
      <span>{loading ? 'loading' : 'loaded'}</span>
      <span>{user?.id ?? 'no-user'}</span>
      <span>{clientRecord?.id ?? 'no-client'}</span>
    </div>
  );
}

describe('AuthProvider magic-link URL handling', () => {
  afterEach(() => {
    getAuthClientMock.mockReset();
    window.history.replaceState({}, '', '/');
  });

  it('bridges implicit magic-link hash tokens into the Supabase session and strips them from the URL', async () => {
    const setSession = vi.fn().mockResolvedValue({ data: {}, error: null });
    const supabase = makeSupabaseClient({ setSession });
    getAuthClientMock.mockReturnValue(supabase);
    window.history.replaceState(
      {},
      '',
      '/portal#access_token=access-token&refresh_token=refresh-token&expires_in=3600&token_type=bearer',
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('loaded')).toBeInTheDocument());

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'access-token',
      refresh_token: 'refresh-token',
    });
    expect(window.location.hash).toBe('');
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('client-1')).toBeInTheDocument();
  });

  it('still clears exposed URL tokens and leaves the gate usable when setSession fails', async () => {
    const setSession = vi.fn().mockRejectedValue(new Error('invalid token'));
    const supabase = makeSupabaseClient({ setSession });
    supabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });
    getAuthClientMock.mockReturnValue(supabase);
    window.history.replaceState(
      {},
      '',
      '/portal#access_token=bad-access&refresh_token=bad-refresh',
    );

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByText('loaded')).toBeInTheDocument());

    expect(setSession).toHaveBeenCalledWith({
      access_token: 'bad-access',
      refresh_token: 'bad-refresh',
    });
    expect(window.location.hash).toBe('');
    expect(screen.getByText('no-user')).toBeInTheDocument();
  });
});
