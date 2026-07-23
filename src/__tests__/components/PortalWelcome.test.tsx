import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import WelcomePage from '@/app/portal/welcome/page';

const replaceMock = vi.hoisted(() => vi.fn());
const updateUserMock = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: vi.fn(),
  }),
}));

vi.mock('@/components/portal/AuthProvider', () => ({
  useAuth: () => ({
    user: {
      user_metadata: {
        full_name: 'Test Client',
        onboarded: false,
      },
    },
    profile: {
      full_name: 'Test Client',
    },
    supabase: {
      auth: {
        updateUser: updateUserMock,
      },
    },
  }),
}));

vi.mock('@/components/portal/PortalNav', () => ({
  default: () => <nav data-testid="portal-nav" />,
}));

vi.mock('@/lib/portal-data', () => ({
  fetchPortalData: vi.fn().mockResolvedValue({
    client: { name: 'Test Client' },
    engagement: { type: 'Private engagement' },
  }),
}));

describe('Private Office onboarding completion', () => {
  beforeEach(() => {
    replaceMock.mockReset();
    updateUserMock.mockReset();
    updateUserMock.mockResolvedValue({ error: null });
  });

  it('persists onboarding before sending the client to the dashboard', async () => {
    render(<WelcomePage />);

    fireEvent.click(screen.getByRole('button', { name: 'Skip to Dashboard →' }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({
        data: { onboarded: true },
      });
      expect(replaceMock).toHaveBeenCalledWith('/portal/dashboard');
    });
  });

  it('keeps the client on onboarding when completion cannot be saved', async () => {
    updateUserMock.mockResolvedValueOnce({
      error: new Error('Update failed'),
    });

    render(<WelcomePage />);
    fireEvent.click(screen.getByRole('button', { name: 'Skip to Dashboard →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We could not save your progress. Please try again.',
    );
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
