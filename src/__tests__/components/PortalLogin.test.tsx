import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PortalLoginPage from '@/app/portal/page';

const signInWithOAuthMock = vi.hoisted(() => vi.fn());

vi.mock('@/components/portal/AuthProvider', () => ({
  useAuth: () => ({
    user: null,
    clientRecord: null,
    isAdmin: false,
    loading: false,
    supabase: {
      auth: {
        signInWithOAuth: signInWithOAuthMock,
      },
    },
  }),
}));

vi.mock('@/components/portal/Scene3D', () => ({
  default: () => <div data-testid="scene-3d" />,
}));

describe('Private Office OAuth login', () => {
  beforeEach(() => {
    signInWithOAuthMock.mockReset();
    signInWithOAuthMock.mockResolvedValue({ data: {}, error: null });
  });

  it('offers Google and Apple sign-in', () => {
    render(<PortalLoginPage />);

    expect(screen.getByRole('button', { name: 'Continue with Google' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue with Apple' })).toBeInTheDocument();
  });

  it.each(['google', 'apple'] as const)('starts the %s PKCE flow through the auth callback', async (provider) => {
    render(<PortalLoginPage />);

    fireEvent.click(
      screen.getByRole('button', {
        name: provider === 'google' ? 'Continue with Google' : 'Continue with Apple',
      }),
    );

    await waitFor(() => {
      expect(signInWithOAuthMock).toHaveBeenCalledWith({
        provider,
        options: {
          redirectTo: 'https://www.jamesroman.la/auth/callback',
        },
      });
    });
  });

  it('returns a provider-specific error when OAuth cannot start', async () => {
    signInWithOAuthMock.mockResolvedValueOnce({
      data: {},
      error: new Error('Provider disabled'),
    });
    render(<PortalLoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue with Apple' }));

    expect(await screen.findByText('We could not connect to Apple. Please try again.')).toBeInTheDocument();
  });
});
