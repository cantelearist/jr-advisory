import { describe, expect, it } from 'vitest';
import { approvedChangeOrderDelta, revisedInvoiceTotal } from '@/lib/change-orders';
import type { ChangeOrder } from '@/lib/database.types';

function changeOrder(overrides: Partial<ChangeOrder>): ChangeOrder {
  return {
    id: crypto.randomUUID(),
    client_id: 'client-1',
    engagement_id: 'engagement-1',
    change_order_number: 'CO-2026-001',
    source_type: 'invoice',
    source_invoice_id: 'invoice-1',
    source_document_id: null,
    title: 'Scope change',
    description: 'Additional work',
    amount_delta: 500,
    status: 'approved',
    issued_at: null,
    approved_at: null,
    declined_at: null,
    created_by: 'admin-1',
    created_at: '2026-07-24T00:00:00.000Z',
    updated_at: '2026-07-24T00:00:00.000Z',
    ...overrides,
  };
}

describe('change-order totals', () => {
  it('applies only approved amendments for the selected invoice', () => {
    const changeOrders = [
      changeOrder({ amount_delta: 500 }),
      changeOrder({ id: 'credit', amount_delta: -100 }),
      changeOrder({ id: 'pending', amount_delta: 900, status: 'sent' }),
      changeOrder({ id: 'other', source_invoice_id: 'invoice-2', amount_delta: 250 }),
    ];

    expect(approvedChangeOrderDelta('invoice-1', changeOrders)).toBe(400);
    expect(revisedInvoiceTotal({ id: 'invoice-1', amount: 1_500 }, changeOrders)).toBe(1_900);
  });
});
