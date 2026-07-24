import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';
import { createInAppNotification, sendNotification } from '@/lib/notifications';
import { invalidateOpenCheckoutSession } from '@/lib/stripe-invoice';

const INVOICE_STATUSES = new Set(['draft', 'sent', 'paid', 'overdue', 'cancelled']);

function requiredText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function validAmount(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

async function notifyInvoiceReady(sb: any, invoice: any) {
  const { data: client } = await sb
    .from('clients')
    .select('id, name, email')
    .eq('id', invoice.client_id)
    .single();

  if (!client) return;

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(invoice.amount));

  if (client.email) {
    await sendNotification({
      type: 'invoice_sent',
      recipientEmail: client.email,
      recipientName: client.name,
      data: {
        invoiceNumber: invoice.invoice_number,
        amount,
        description: invoice.description,
        dueDate: invoice.due_date,
      },
    });
  }

  await createInAppNotification({
    target: client.id,
    type: 'invoice',
    title: `Invoice ${invoice.invoice_number} is ready`,
    body: `${amount} due ${invoice.due_date}`,
    link: '/portal/invoices',
    metadata: { invoice_id: invoice.id },
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const clientId = requiredText(body?.client_id);
    const engagementId = requiredText(body?.engagement_id);
    const invoiceNumber = requiredText(body?.invoice_number);
    const description = requiredText(body?.description);
    const dueDate = requiredText(body?.due_date);
    const notes = requiredText(body?.notes) || null;
    const amount = validAmount(body?.amount);
    const status = INVOICE_STATUSES.has(body?.status) ? body.status : 'draft';

    if (!clientId || !engagementId || !invoiceNumber || !description || !dueDate || amount === null) {
      return NextResponse.json({ error: 'Valid invoice details are required' }, { status: 400 });
    }
    if (invoiceNumber.length > 80 || description.length > 500 || (notes?.length || 0) > 5_000) {
      return NextResponse.json({ error: 'Invoice content exceeds the allowed length' }, { status: 400 });
    }

    const { data: engagement } = await auth.sb
      .from('engagements')
      .select('id')
      .eq('id', engagementId)
      .eq('client_id', clientId)
      .maybeSingle();
    if (!engagement) {
      return NextResponse.json({ error: 'Engagement does not belong to client' }, { status: 400 });
    }

    const { data: duplicate, error: duplicateError } = await auth.sb
      .from('invoices')
      .select('id')
      .eq('invoice_number', invoiceNumber)
      .maybeSingle();
    if (duplicateError) return internalError(duplicateError, 'invoices.duplicate_check');
    if (duplicate) {
      return NextResponse.json({ error: 'Invoice number already exists' }, { status: 409 });
    }

    const { data: invoice, error } = await auth.sb
      .from('invoices')
      .insert({
        client_id: clientId,
        engagement_id: engagementId,
        invoice_number: invoiceNumber,
        description,
        amount,
        due_date: dueDate,
        status,
        notes,
        paid_date: status === 'paid' ? new Date().toISOString().slice(0, 10) : null,
      })
      .select()
      .single();
    if (error || !invoice) return internalError(error, 'invoices.create');

    await auth.sb.from('audit_log').insert({
      user_id: auth.user.id,
      action: 'invoice_created',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: { invoice_number: invoice.invoice_number, status: invoice.status, amount: invoice.amount },
    });

    if (invoice.status === 'sent') {
      await notifyInvoiceReady(auth.sb, invoice);
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    return internalError(error, 'invoices.create');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const invoiceId = requiredText(body?.invoice_id);
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });
    }

    const { data: existing } = await auth.sb
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (existing.status !== 'draft') {
      const rewritesOriginal =
        (body.amount !== undefined && Number(body.amount) !== Number(existing.amount)) ||
        (body.description !== undefined && requiredText(body.description) !== existing.description) ||
        (body.due_date !== undefined && requiredText(body.due_date) !== existing.due_date);
      if (rewritesOriginal) {
        return NextResponse.json(
          { error: 'Issued invoices cannot be rewritten; create a change order instead' },
          { status: 409 },
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!INVOICE_STATUSES.has(body.status)) {
        return NextResponse.json({ error: 'Invalid invoice status' }, { status: 400 });
      }
      updates.status = body.status;
      updates.paid_date = body.status === 'paid'
        ? existing.paid_date || new Date().toISOString().slice(0, 10)
        : null;
    }
    if (body.amount !== undefined) {
      const amount = validAmount(body.amount);
      if (amount === null) {
        return NextResponse.json({ error: 'Invoice amount must be greater than zero' }, { status: 400 });
      }
      updates.amount = amount;
    }
    if (body.description !== undefined) {
      const description = requiredText(body.description);
      if (!description || description.length > 500) {
        return NextResponse.json({ error: 'Valid invoice description required' }, { status: 400 });
      }
      updates.description = description;
    }
    if (body.due_date !== undefined) {
      const dueDate = requiredText(body.due_date);
      if (!dueDate) return NextResponse.json({ error: 'Valid due date required' }, { status: 400 });
      updates.due_date = dueDate;
    }
    if (body.notes !== undefined) {
      const notes = requiredText(body.notes);
      if (notes.length > 5_000) {
        return NextResponse.json({ error: 'Invoice notes are too long' }, { status: 400 });
      }
      updates.notes = notes || null;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No invoice changes supplied' }, { status: 400 });
    }

    const invalidatesPaymentLink =
      Boolean(existing.stripe_session_id) &&
      (
        updates.amount !== undefined ||
        (typeof updates.status === 'string' &&
          !['sent', 'overdue'].includes(updates.status))
      );
    if (invalidatesPaymentLink) {
      try {
        await invalidateOpenCheckoutSession(existing.stripe_session_id);
        updates.stripe_session_id = null;
      } catch (error) {
        return NextResponse.json(
          {
            error: error instanceof Error
              ? error.message
              : 'Unable to invalidate the existing payment link',
          },
          { status: 409 },
        );
      }
    }

    updates.updated_at = new Date().toISOString();
    const { data: invoice, error } = await auth.sb
      .from('invoices')
      .update(updates)
      .eq('id', invoiceId)
      .select()
      .single();
    if (error || !invoice) return internalError(error, 'invoices.update');

    await auth.sb.from('audit_log').insert({
      user_id: auth.user.id,
      action: 'invoice_updated',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: { previous_status: existing.status, status: invoice.status, amount: invoice.amount },
    });

    if (existing.status !== 'sent' && invoice.status === 'sent') {
      await notifyInvoiceReady(auth.sb, invoice);
    }

    return NextResponse.json({ invoice });
  } catch (error) {
    return internalError(error, 'invoices.update');
  }
}
