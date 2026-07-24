import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PortalLoginPage from '@/app/portal/page';
import { resolvePortalDestination } from '@/lib/portal-routing';

const {
  signInWithOAuthMock,
  routerPushMock,
  routerReplaceMock,
  fetchMock,
} = vi.hoisted(() => ({
  signInWithOAuthMock: vi.fn(),
  routerPushMock: vi.fn(),
  routerReplaceMock: vi.fn(),
  fetchMock: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: routerPushMock,
    replace: routerReplaceMock,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

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

vi.stubGlobal('fetch', fetchMock);

describe('Private Office OAuth login', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_LOGIN_ENABLED', 'true');
    signInWithOAuthMock.mockReset();
    routerPushMock.mockReset();
    routerReplaceMock.mockReset();
    fetchMock.mockReset();
    signInWithOAuthMock.mockResolvedValue({ data: {}, error: null });
  });

  it('hides disabled providers when OAuth login is not enabled', () => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_LOGIN_ENABLED', 'false');

    render(<PortalLoginPage />);

    expect(screen.queryByRole('button', { name: 'Continue with Google' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue with Apple' })).not.toBeInTheDocument();
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

describe('Private Office password login', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_OAUTH_LOGIN_ENABLED', 'false');
    routerPushMock.mockReset();
    routerReplaceMock.mockReset();
    fetchMock.mockReset();
  });

  it('shows email and password login by default', () => {
    render(<PortalLoginPage />);

    expect(screen.getByLabelText('Email or username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enter Your Office' })).toBeInTheDocument();
  });

  it('makes the login form visible without a long cinematic wait', async () => {
    render(<PortalLoginPage />);

    const wrapper = screen.getByLabelText('Password').closest('.portal-login__form-wrapper');
    expect(wrapper).not.toHaveClass('portal-login__form-wrapper--visible');

    await waitFor(
      () => expect(wrapper).toHaveClass('portal-login__form-wrapper--visible'),
      { timeout: 500 },
    );
  });

  it('routes a privileged password login to MFA without a long exit delay', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        user: { role: 'admin', onboarded: true },
        mfaRequired: true,
      }),
    });
    render(<PortalLoginPage />);

    fireEvent.change(screen.getByLabelText('Email or username'), {
      target: { value: 'admin@example.com' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'test-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enter Your Office' }));

    await waitFor(
      () => expect(routerPushMock).toHaveBeenCalledWith(
        '/portal/mfa?redirect=%2Fportal%2Fadmin',
      ),
      { timeout: 500 },
    );
  });

  it('lets users switch between password and magic-link login', () => {
    render(<PortalLoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Use magic link instead' }));
    expect(screen.getByLabelText('Engagement email')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Use email and password' }));
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });
});

describe('Private Office post-auth routing', () => {
  it('requires invited clients to complete onboarding before a requested portal route', () => {
    expect(resolvePortalDestination({
      redirect: '/portal/documents',
      isAdmin: false,
      hasClientRecord: true,
      onboarded: false,
    })).toBe('/portal/welcome');
  });

  it('sends onboarded clients with a linked record to the dashboard', () => {
    expect(resolvePortalDestination({
      redirect: null,
      isAdmin: false,
      hasClientRecord: true,
      onboarded: true,
    })).toBe('/portal/dashboard');
  });

  it('preserves safe portal redirects after onboarding', () => {
    expect(resolvePortalDestination({
      redirect: '/portal/documents',
      isAdmin: false,
      hasClientRecord: true,
      onboarded: true,
    })).toBe('/portal/documents');
  });

  it('rejects external redirects', () => {
    expect(resolvePortalDestination({
      redirect: '//attacker.example',
      isAdmin: true,
      hasClientRecord: false,
      onboarded: true,
    })).toBe('/portal/admin');
  });
});
