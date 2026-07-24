import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST as dismissNotification } from '@/app/api/notifications/dismiss/route';
import { POST as sendMessage } from '@/app/api/messages/send/route';

const requireAuthMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  createInAppNotification: createNotificationMock,
  sendNotification: sendNotificationMock,
}));

function post(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://www.jamesroman.la${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });
}

describe('secondary API authorization boundaries', () => {
  afterEach(() => {
    requireAuthMock.mockReset();
    createNotificationMock.mockReset();
    sendNotificationMock.mockReset();
  });

  it('scopes a single notification dismissal to the caller target', async () => {
    const updateEq = vi.fn();
    const updateChain: Record<string, unknown> = {};
    updateChain.eq = updateEq.mockImplementation(() => updateChain);
    updateChain.select = vi.fn(async () => ({ data: [{ id: 'notification-1' }], error: null }));
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: { id: 'own-client' }, error: null })),
              })),
            })),
          };
        }
        if (table === 'notifications') {
          return { update: vi.fn(() => updateChain) };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'user-1' },
      profile: { id: 'user-1', role: 'client' },
      isAdmin: false,
      sb,
    });

    const response = await dismissNotification(post('/api/notifications/dismiss', {
      notification_id: 'notification-1',
    }));

    expect(response.status).toBe(200);
    expect(updateEq).toHaveBeenCalledWith('id', 'notification-1');
    expect(updateEq).toHaveBeenCalledWith('target', 'own-client');
  });

  it('derives client sender identity and verifies the engagement relationship', async () => {
    const insertMessageMock = vi.fn();
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: 'own-client', name: 'Real Client' },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'engagements') {
          const engagementQuery: Record<string, unknown> = {};
          engagementQuery.eq = vi.fn(() => engagementQuery);
          engagementQuery.maybeSingle = vi.fn(async () => ({
            data: { id: 'engagement-1' },
            error: null,
          }));
          return { select: vi.fn(() => engagementQuery) };
        }
        if (table === 'messages') {
          return {
            insert: insertMessageMock.mockImplementation((payload) => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: 'message-1', ...payload },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({ data: [], error: null })),
            })),
          };
        }
        return { insert: vi.fn(async () => ({ data: null, error: null })) };
      }),
    };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'user-1', email: 'client@example.com' },
      profile: { id: 'user-1', role: 'client', full_name: 'Spoofed Profile' },
      isAdmin: false,
      sb,
    });
    createNotificationMock.mockResolvedValueOnce(undefined);

    const response = await sendMessage(post('/api/messages/send', {
      client_id: 'own-client',
      engagement_id: 'engagement-1',
      sender_type: 'firm',
      sender_name: 'Administrator',
      subject: 'Question',
      body: 'Please review.',
    }));

    expect(response.status).toBe(200);
    expect(insertMessageMock).toHaveBeenCalledWith(expect.objectContaining({
      sender_type: 'client',
      sender_name: 'Real Client',
      client_id: 'own-client',
      engagement_id: 'engagement-1',
      read: false,
    }));
  });

  it('rejects oversized message content before writing to the database', async () => {
    const sb = { from: vi.fn() };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'admin-1', email: 'admin@example.com' },
      profile: { id: 'admin-1', role: 'admin', full_name: 'Administrator' },
      isAdmin: true,
      sb,
    });

    const response = await sendMessage(post('/api/messages/send', {
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      subject: 'A'.repeat(201),
      body: 'Please review.',
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Subject must be 200 characters or fewer',
    });
    expect(sb.from).not.toHaveBeenCalled();
  });
});
