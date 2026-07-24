import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PATCH, POST } from '@/app/api/change-orders/route';

const requireAdminMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAdmin: requireAdminMock,
  requireAuth: vi.fn(),
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: sendNotificationMock,
  createInAppNotification: createNotificationMock,
}));

function request(body: Record<string, unknown>) {
  return new NextRequest('https://www.jamesroman.la/api/change-orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/change-orders', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
    sendNotificationMock.mockReset();
    createNotificationMock.mockReset();
  });

  it('creates a sent invoice amendment and notifies the client', async () => {
    const saved = {
      id: 'change-order-1',
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      change_order_number: 'CO-2026-001',
      source_type: 'invoice',
      source_invoice_id: 'invoice-1',
      source_document_id: null,
      title: 'Additional testing',
      description: 'Expanded sampling requested by the client.',
      amount_delta: 750,
      status: 'sent',
    };
    const engagementQuery: Record<string, any> = {};
    engagementQuery.eq = vi.fn(() => engagementQuery);
    engagementQuery.maybeSingle = vi.fn(async () => ({ data: { id: 'engagement-1' }, error: null }));
    const sourceQuery: Record<string, any> = {};
    sourceQuery.eq = vi.fn(() => sourceQuery);
    sourceQuery.maybeSingle = vi.fn(async () => ({ data: { id: 'invoice-1' }, error: null }));
    const duplicateQuery: Record<string, any> = {};
    duplicateQuery.eq = vi.fn(() => duplicateQuery);
    duplicateQuery.maybeSingle = vi.fn(async () => ({ data: null, error: null }));

    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'engagements') return { select: vi.fn(() => engagementQuery) };
        if (table === 'invoices') return { select: vi.fn(() => sourceQuery) };
        if (table === 'change_orders') {
          return {
            select: vi.fn(() => duplicateQuery),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: saved, error: null })),
              })),
            })),
          };
        }
        if (table === 'clients') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { id: 'client-1', name: 'Client One', email: 'client@example.com' },
                  error: null,
                })),
              })),
            })),
          };
        }
        return { insert: vi.fn(async () => ({ data: null, error: null })) };
      }),
    };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb,
    });
    sendNotificationMock.mockResolvedValueOnce({ success: true });
    createNotificationMock.mockResolvedValueOnce({ success: true });

    const response = await POST(request({
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      change_order_number: 'CO-2026-001',
      source_type: 'invoice',
      source_invoice_id: 'invoice-1',
      title: 'Additional testing',
      description: 'Expanded sampling requested by the client.',
      amount_delta: 750,
      status: 'sent',
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ changeOrder: saved });
    expect(sendNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'change_order_sent',
      recipientEmail: 'client@example.com',
    }));
    expect(createNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      target: 'client-1',
      type: 'change_order',
      link: '/portal/invoices',
    }));
  });

  it('does not allow a caller to create an already-approved amendment', async () => {
    const sb = { from: vi.fn() };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb,
    });

    const response = await POST(request({
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      change_order_number: 'CO-2026-002',
      source_type: 'invoice',
      source_invoice_id: 'invoice-1',
      title: 'Additional testing',
      description: 'Expanded sampling requested by the client.',
      amount_delta: 750,
      status: 'approved',
    }));

    expect(response.status).toBe(400);
    expect(sb.from).not.toHaveBeenCalled();
  });

  it('refuses to approve an amendment after its original invoice is paid', async () => {
    const existing = {
      id: 'change-order-1',
      source_type: 'invoice',
      source_invoice_id: 'invoice-1',
      status: 'sent',
    };
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'change_orders') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({ data: existing, error: null })),
              })),
            })),
          };
        }
        if (table === 'invoices') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: { status: 'paid', stripe_session_id: null },
                  error: null,
                })),
              })),
            })),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      isAdmin: true,
      sb,
    });
    const patchRequest = new NextRequest('https://www.jamesroman.la/api/change-orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        change_order_id: 'change-order-1',
        status: 'approved',
      }),
    });

    const response = await PATCH(patchRequest);

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Paid or cancelled invoices cannot be amended; create a new invoice',
    });
  });
});
