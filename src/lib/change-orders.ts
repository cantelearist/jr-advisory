import type { ChangeOrder, Invoice } from './database.types';

export function approvedChangeOrderDelta(
  invoiceId: string,
  changeOrders: ChangeOrder[],
): number {
  return changeOrders
    .filter(
      (changeOrder) =>
        changeOrder.source_type === 'invoice' &&
        changeOrder.source_invoice_id === invoiceId &&
        changeOrder.status === 'approved',
    )
    .reduce((total, changeOrder) => total + Number(changeOrder.amount_delta), 0);
}

export function revisedInvoiceTotal(
  invoice: Pick<Invoice, 'id' | 'amount'>,
  changeOrders: ChangeOrder[],
): number {
  return Number(invoice.amount) + approvedChangeOrderDelta(invoice.id, changeOrders);
}

export async function fetchApprovedChangeOrderDelta(
  sb: any,
  invoiceId: string,
): Promise<number> {
  const { data, error } = await sb
    .from('change_orders')
    .select('amount_delta')
    .eq('source_type', 'invoice')
    .eq('source_invoice_id', invoiceId)
    .eq('status', 'approved');

  if (error) throw error;
  return (data || []).reduce(
    (total: number, changeOrder: { amount_delta: number | string }) =>
      total + Number(changeOrder.amount_delta),
    0,
  );
}
