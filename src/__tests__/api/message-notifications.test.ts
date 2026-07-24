import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/messages/send/route';

const requireAuthMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const sendNotificationsMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: sendNotificationMock,
  sendNotifications: sendNotificationsMock,
  createInAppNotification: createNotificationMock,
}));

function request() {
  return new NextRequest('https://www.jamesroman.la/api/messages/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify({
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      subject: 'New update',
      body: 'The requested document is ready for review.',
    }),
  });
}

function messageDatabase(options: { clientSender?: boolean } = {}) {
  const message = {
    id: 'message-1',
    client_id: 'client-1',
    engagement_id: 'engagement-1',
    subject: 'New update',
    body: 'The requested document is ready for review.',
  };
  const engagementQuery: Record<string, any> = {};
  engagementQuery.eq = vi.fn(() => engagementQuery);
  engagementQuery.maybeSingle = vi.fn(async () => ({ data: { id: 'engagement-1' }, error: null }));

  return {
    message,
    sb: {
      from: vi.fn((table: string) => {
        if (table === 'engagements') return { select: vi.fn(() => engagementQuery) };
        if (table === 'messages') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: message, error: null })),
              })),
            })),
          };
        }
        if (table === 'clients') {
          const client = options.clientSender
            ? { id: 'client-1', name: 'Client One' }
            : { name: 'Client One', email: 'client@example.com' };
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: client, error: null })),
              })),
            })),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(async () => ({
                data: [
                  { email: 'admin@example.com', full_name: 'Administrator' },
                  { email: 'manager@example.com', full_name: 'Manager' },
                ],
                error: null,
              })),
            })),
          };
        }
        return { insert: vi.fn(async () => ({ data: null, error: null })) };
      }),
    },
  };
}

describe('message email notifications', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
    sendNotificationMock.mockReset();
    sendNotificationsMock.mockReset();
    createNotificationMock.mockReset();
  });

  it('emails the client for each firm message', async () => {
    const { sb } = messageDatabase();
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@example.com' },
      profile: { full_name: 'James Roman', role: 'admin' },
      isAdmin: true,
      sb,
    });
    sendNotificationMock.mockResolvedValueOnce({ success: true });
    createNotificationMock.mockResolvedValueOnce({ success: true });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(sendNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'new_message',
      recipientEmail: 'client@example.com',
    }));
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      notification: { emailSent: true, failed: 0 },
    });
  });

  it('emails the advisory team for each client message', async () => {
    const { sb } = messageDatabase({ clientSender: true });
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'client-user', email: 'client@example.com' },
      profile: { full_name: 'Client One', role: 'client' },
      isAdmin: false,
      sb,
    });
    sendNotificationsMock.mockResolvedValueOnce({ sent: 2, failed: 0, results: [] });
    createNotificationMock.mockResolvedValueOnce({ success: true });

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(sendNotificationsMock).toHaveBeenCalledWith([
      expect.objectContaining({ recipientEmail: 'admin@example.com' }),
      expect.objectContaining({ recipientEmail: 'manager@example.com' }),
    ]);
    await expect(response.json()).resolves.toMatchObject({
      success: true,
      notification: { emailSent: true, failed: 0 },
    });
  });
});
