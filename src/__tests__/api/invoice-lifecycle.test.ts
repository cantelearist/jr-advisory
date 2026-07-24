import { NextRequest, NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PATCH, POST } from '@/app/api/invoices/route';
import { GET as getPaymentStatus } from '@/app/api/payments/status/route';

const requireAdminMock = vi.hoisted(() => vi.fn());
const requireAuthMock = vi.hoisted(() => vi.fn());
const sendNotificationMock = vi.hoisted(() => vi.fn());
const createNotificationMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-auth', () => ({
  requireAdmin: requireAdminMock,
  requireAuth: requireAuthMock,
  isAuthError: (value: unknown) => value instanceof NextResponse,
}));

vi.mock('@/lib/notifications', () => ({
  sendNotification: sendNotificationMock,
  createInAppNotification: createNotificationMock,
}));

function request(path: string, body: Record<string, unknown>) {
  return new NextRequest(`https://www.jamesroman.la${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('invoice lifecycle', () => {
  afterEach(() => {
    requireAdminMock.mockReset();
    requireAuthMock.mockReset();
    sendNotificationMock.mockReset();
    createNotificationMock.mockReset();
  });

  it('creates a sent invoice and notifies the client', async () => {
    const invoice = {
      id: 'invoice-1',
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      invoice_number: 'INV-100',
      description: 'Advisory services',
      amount: 1500,
      due_date: '2026-08-01',
      status: 'sent',
      paid_date: null,
    };
    const engagementQuery: Record<string, any> = {};
    engagementQuery.eq = vi.fn(() => engagementQuery);
    engagementQuery.maybeSingle = vi.fn(async () => ({ data: { id: 'engagement-1' }, error: null }));
    const duplicateQuery: Record<string, any> = {};
    duplicateQuery.eq = vi.fn(() => duplicateQuery);
    duplicateQuery.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'engagements') {
          return { select: vi.fn(() => engagementQuery) };
        }
        if (table === 'invoices') {
          return {
            select: vi.fn(() => duplicateQuery),
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(async () => ({ data: invoice, error: null })),
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
      profile: { role: 'admin' },
      isAdmin: true,
      sb,
    });
    sendNotificationMock.mockResolvedValueOnce({ success: true });
    createNotificationMock.mockResolvedValueOnce({ success: true });

    const response = await POST(request('/api/invoices', {
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      invoice_number: 'INV-100',
      description: 'Advisory services',
      amount: 1500,
      due_date: '2026-08-01',
      status: 'sent',
    }));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ invoice });
    expect(sendNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      type: 'invoice_sent',
      recipientEmail: 'client@example.com',
    }));
    expect(createNotificationMock).toHaveBeenCalledWith(expect.objectContaining({
      target: 'client-1',
      link: '/portal/invoices',
    }));
  });

  it('rejects zero-value invoices before any database write', async () => {
    const sb = { from: vi.fn() };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      profile: { role: 'admin' },
      isAdmin: true,
      sb,
    });

    const response = await POST(request('/api/invoices', {
      client_id: 'client-1',
      engagement_id: 'engagement-1',
      invoice_number: 'INV-100',
      description: 'Advisory services',
      amount: 0,
      due_date: '2026-08-01',
    }));

    expect(response.status).toBe(400);
    expect(sb.from).not.toHaveBeenCalled();
  });

  it('preserves an issued invoice and requires a change order for price changes', async () => {
    const invoiceQuery = {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: {
              id: 'invoice-1',
              amount: 1500,
              description: 'Original advisory scope',
              due_date: '2026-08-01',
              status: 'sent',
            },
            error: null,
          })),
        })),
      })),
    };
    const sb = { from: vi.fn(() => invoiceQuery) };
    requireAdminMock.mockResolvedValueOnce({
      user: { id: 'admin-1' },
      profile: { role: 'admin' },
      isAdmin: true,
      sb,
    });
    const response = await PATCH(new NextRequest(
      'https://www.jamesroman.la/api/invoices',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: 'invoice-1', amount: 1800 }),
      },
    ));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: 'Issued invoices cannot be rewritten; create a change order instead',
    });
  });

  it('returns confirmed payment status only for the invoice owner', async () => {
    const invoiceQuery: Record<string, any> = {};
    invoiceQuery.eq = vi.fn(() => invoiceQuery);
    invoiceQuery.maybeSingle = vi.fn(async () => ({
      data: {
        id: 'invoice-1',
        client_id: 'client-1',
        invoice_number: 'INV-100',
        amount: 1500,
        status: 'paid',
        paid_date: '2026-07-23',
        stripe_session_id: 'cs_test_123',
      },
      error: null,
    }));
    const sb = {
      from: vi.fn((table: string) => {
        if (table === 'invoices') return { select: vi.fn(() => invoiceQuery) };
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: { id: 'client-1' }, error: null })),
            })),
          })),
        };
      }),
    };
    requireAuthMock.mockResolvedValueOnce({
      user: { id: 'client-user-1' },
      profile: { role: 'client' },
      isAdmin: false,
      sb,
    });

    const response = await getPaymentStatus(new NextRequest(
      'https://www.jamesroman.la/api/payments/status?session_id=cs_test_123',
    ));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      confirmed: true,
      invoice: { invoice_number: 'INV-100', status: 'paid' },
    });
  });
});
