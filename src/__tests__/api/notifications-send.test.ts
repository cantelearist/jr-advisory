import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/notifications/send/route';

const requireAdminWithAccessTokenMock = vi.hoisted(() => vi.fn());
const isAuthErrorMock = vi.hoisted(() => vi.fn());
const isInternalSecretAuthorizedMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const sendNotificationsMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAdminWithAccessToken: requireAdminWithAccessTokenMock,
  isAuthError: isAuthErrorMock,
}));

vi.mock('@/lib/internal-secret', () => ({
  isInternalSecretAuthorized: isInternalSecretAuthorizedMock,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: sendNotificationMock,
  sendNotifications: sendNotificationsMock,
}));

function request(headers?: HeadersInit) {
  return new NextRequest('https://www.jamesroman.la/api/notifications/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({
      type: 'welcome',
      recipientEmail: 'client@example.com',
      recipientName: 'Client',
      data: { email: 'client@example.com' },
    }),
  });
}

describe('POST /api/notifications/send', () => {
  afterEach(() => {
    requireAdminWithAccessTokenMock.mockReset();
    isAuthErrorMock.mockReset();
    isInternalSecretAuthorizedMock.mockReset();
    sendNotificationMock.mockReset();
    sendNotificationsMock.mockReset();
  });

  it('rejects requests without an internal secret or bearer token', async () => {
    isInternalSecretAuthorizedMock.mockReturnValue(false);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(requireAdminWithAccessTokenMock).not.toHaveBeenCalled();
  });

  it('delegates bearer-token access to the AAL2 admin gate', async () => {
    isInternalSecretAuthorizedMock.mockReturnValue(false);
    const denied = NextResponse.json(
      { error: 'MFA enrollment and verification required' },
      { status: 403 },
    );
    requireAdminWithAccessTokenMock.mockResolvedValue(denied);
    isAuthErrorMock.mockReturnValue(true);

    const response = await POST(request({ Authorization: 'Bearer access-token' }));

    expect(requireAdminWithAccessTokenMock).toHaveBeenCalledWith('access-token');
    expect(response.status).toBe(403);
    expect(sendNotificationMock).not.toHaveBeenCalled();
  });

  it('allows an internal notification secret without a user session', async () => {
    isInternalSecretAuthorizedMock.mockReturnValue(true);
    sendNotificationMock.mockResolvedValue({ success: true, messageId: 'msg-1' });

    const response = await POST(request({ Authorization: 'Bearer internal-secret' }));

    expect(response.status).toBe(200);
    expect(requireAdminWithAccessTokenMock).not.toHaveBeenCalled();
    expect(sendNotificationMock).toHaveBeenCalledOnce();
  });
});
