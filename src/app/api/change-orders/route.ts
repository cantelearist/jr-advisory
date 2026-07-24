import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, requireAuth, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';
import { createInAppNotification, sendNotification } from '@/lib/notifications';
import { invalidateOpenCheckoutSession } from '@/lib/stripe-invoice';

const STATUSES = new Set(['draft', 'sent', 'approved', 'declined', 'cancelled']);
const TRANSITIONS: Record<string, Set<string>> = {
  draft: new Set(['sent', 'cancelled']),
  sent: new Set(['approved', 'declined', 'cancelled']),
  approved: new Set(),
  declined: new Set(),
  cancelled: new Set(),
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function financialDelta(value: unknown): number | null {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) / 100 : null;
}

async function notifyChangeOrder(sb: any, changeOrder: any) {
  const { data: client } = await sb
    .from('clients')
    .select('id, name, email')
    .eq('id', changeOrder.client_id)
    .single();

  if (!client) return;

  const formattedDelta = Number(changeOrder.amount_delta) === 0
    ? ''
    : new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      signDisplay: 'always',
    }).format(Number(changeOrder.amount_delta));

  const deliveries = [];
  if (client.email) {
    deliveries.push(sendNotification({
      type: 'change_order_sent' as const,
      recipientEmail: client.email,
      recipientName: client.name,
      data: {
        changeOrderNumber: changeOrder.change_order_number,
        title: changeOrder.title,
        description: changeOrder.description,
        amountDelta: formattedDelta,
      },
    }));
  }
  deliveries.push(createInAppNotification({
    target: client.id,
    type: 'change_order',
    title: `Change order ${changeOrder.change_order_number}`,
    body: formattedDelta
      ? `${changeOrder.title} · ${formattedDelta}`
      : changeOrder.title,
    link: '/portal/invoices',
    metadata: { change_order_id: changeOrder.id },
  }));

  await Promise.all(deliveries);
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  try {
    let query = auth.sb
      .from('change_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!auth.isAdmin) {
      const { data: client } = await auth.sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .maybeSingle();
      if (!client) return NextResponse.json({ changeOrders: [] });
      query = query.eq('client_id', client.id).in('status', ['sent', 'approved', 'declined']);
    }

    const requestedClientId = req.nextUrl.searchParams.get('client_id');
    if (auth.isAdmin && requestedClientId) {
      query = query.eq('client_id', requestedClientId);
    }

    const { data, error } = await query;
    if (error) return internalError(error, 'change_orders.list');
    return NextResponse.json({ changeOrders: data || [] });
  } catch (error) {
    return internalError(error, 'change_orders.list');
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const clientId = text(body?.client_id);
    const engagementId = text(body?.engagement_id);
    const changeOrderNumber = text(body?.change_order_number);
    const sourceType = body?.source_type === 'contract' ? 'contract' : 'invoice';
    const sourceInvoiceId = sourceType === 'invoice' ? text(body?.source_invoice_id) : '';
    const sourceDocumentId = sourceType === 'contract' ? text(body?.source_document_id) : '';
    const title = text(body?.title);
    const description = text(body?.description);
    const amountDelta = financialDelta(body?.amount_delta);
    if (body?.status !== undefined && body.status !== 'draft' && body.status !== 'sent') {
      return NextResponse.json(
        { error: 'New change orders must begin as draft or sent' },
        { status: 400 },
      );
    }
    const status = body?.status === 'sent' ? 'sent' : 'draft';

    if (
      !clientId ||
      !engagementId ||
      !changeOrderNumber ||
      !title ||
      !description ||
      amountDelta === null ||
      (sourceType === 'invoice' && (!sourceInvoiceId || amountDelta === 0)) ||
      (sourceType === 'contract' && !sourceDocumentId)
    ) {
      return NextResponse.json({ error: 'Valid change-order details are required' }, { status: 400 });
    }
    if (changeOrderNumber.length > 80 || title.length > 200 || description.length > 5_000) {
      return NextResponse.json({ error: 'Change-order content exceeds the allowed length' }, { status: 400 });
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

    const sourceTable = sourceType === 'invoice' ? 'invoices' : 'documents';
    const sourceId = sourceType === 'invoice' ? sourceInvoiceId : sourceDocumentId;
    const sourceFields = sourceType === 'contract' ? 'id, category' : 'id';
    const { data: source } = await auth.sb
      .from(sourceTable)
      .select(sourceFields)
      .eq('id', sourceId)
      .eq('client_id', clientId)
      .eq('engagement_id', engagementId)
      .maybeSingle();
    if (!source) {
      return NextResponse.json({ error: 'Original record does not belong to this engagement' }, { status: 400 });
    }
    if (
      sourceType === 'contract' &&
      !['contracts', 'proposals', 'nda', 'clearance'].includes(source.category)
    ) {
      return NextResponse.json({ error: 'Original document is not a contract record' }, { status: 400 });
    }

    const { data: duplicate, error: duplicateError } = await auth.sb
      .from('change_orders')
      .select('id')
      .eq('change_order_number', changeOrderNumber)
      .maybeSingle();
    if (duplicateError) return internalError(duplicateError, 'change_orders.duplicate_check');
    if (duplicate) {
      return NextResponse.json({ error: 'Change-order number already exists' }, { status: 409 });
    }

    const now = new Date().toISOString();
    const { data: changeOrder, error } = await auth.sb
      .from('change_orders')
      .insert({
        client_id: clientId,
        engagement_id: engagementId,
        change_order_number: changeOrderNumber,
        source_type: sourceType,
        source_invoice_id: sourceInvoiceId || null,
        source_document_id: sourceDocumentId || null,
        title,
        description,
        amount_delta: amountDelta,
        status,
        issued_at: status === 'sent' ? now : null,
        approved_at: null,
        declined_at: null,
        created_by: auth.user.id,
      })
      .select()
      .single();
    if (error || !changeOrder) return internalError(error, 'change_orders.create');

    await auth.sb.from('audit_log').insert({
      user_id: auth.user.id,
      action: 'change_order_created',
      entity_type: 'change_order',
      entity_id: changeOrder.id,
      metadata: {
        change_order_number: changeOrder.change_order_number,
        source_type: changeOrder.source_type,
        amount_delta: changeOrder.amount_delta,
        status: changeOrder.status,
      },
    });

    if (changeOrder.status === 'sent') {
      await notifyChangeOrder(auth.sb, changeOrder);
    }

    return NextResponse.json({ changeOrder }, { status: 201 });
  } catch (error) {
    return internalError(error, 'change_orders.create');
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (isAuthError(auth)) return auth;

  try {
    const body = await req.json();
    const changeOrderId = text(body?.change_order_id);
    if (!changeOrderId) {
      return NextResponse.json({ error: 'change_order_id required' }, { status: 400 });
    }

    const { data: existing } = await auth.sb
      .from('change_orders')
      .select('*')
      .eq('id', changeOrderId)
      .single();
    if (!existing) {
      return NextResponse.json({ error: 'Change order not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.has(body.status) || !TRANSITIONS[existing.status]?.has(body.status)) {
        return NextResponse.json({ error: 'Invalid change-order status transition' }, { status: 409 });
      }
      const now = new Date().toISOString();
      updates.status = body.status;
      if (body.status === 'sent') updates.issued_at = now;
      if (body.status === 'approved') updates.approved_at = now;
      if (body.status === 'declined') updates.declined_at = now;
    }

    if (existing.status !== 'draft' && (
      body.title !== undefined ||
      body.description !== undefined ||
      body.amount_delta !== undefined
    )) {
      return NextResponse.json(
        { error: 'Issued change orders cannot be rewritten; cancel and create a new amendment' },
        { status: 409 },
      );
    }

    if (body.title !== undefined) {
      const title = text(body.title);
      if (!title || title.length > 200) {
        return NextResponse.json({ error: 'Valid title required' }, { status: 400 });
      }
      updates.title = title;
    }
    if (body.description !== undefined) {
      const description = text(body.description);
      if (!description || description.length > 5_000) {
        return NextResponse.json({ error: 'Valid description required' }, { status: 400 });
      }
      updates.description = description;
    }
    if (body.amount_delta !== undefined) {
      const amountDelta = financialDelta(body.amount_delta);
      if (amountDelta === null || (existing.source_type === 'invoice' && amountDelta === 0)) {
        return NextResponse.json({ error: 'Valid financial change required' }, { status: 400 });
      }
      updates.amount_delta = amountDelta;
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No change-order changes supplied' }, { status: 400 });
    }

    const changesApprovedInvoiceBalance =
      existing.source_type === 'invoice' &&
      existing.source_invoice_id &&
      updates.status === 'approved';
    if (changesApprovedInvoiceBalance) {
      const { data: invoice } = await auth.sb
        .from('invoices')
        .select('status, stripe_session_id')
        .eq('id', existing.source_invoice_id)
        .single();
      if (!invoice || invoice.status === 'paid' || invoice.status === 'cancelled') {
        return NextResponse.json(
          { error: 'Paid or cancelled invoices cannot be amended; create a new invoice' },
          { status: 409 },
        );
      }
      if (invoice?.stripe_session_id) {
        try {
          await invalidateOpenCheckoutSession(invoice.stripe_session_id);
        } catch (error) {
          return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unable to invalidate payment link' },
            { status: 409 },
          );
        }
        await auth.sb
          .from('invoices')
          .update({ stripe_session_id: null })
          .eq('id', existing.source_invoice_id);
      }
    }

    const { data: changeOrder, error } = await auth.sb
      .from('change_orders')
      .update(updates)
      .eq('id', changeOrderId)
      .select()
      .single();
    if (error || !changeOrder) return internalError(error, 'change_orders.update');

    await auth.sb.from('audit_log').insert({
      user_id: auth.user.id,
      action: 'change_order_updated',
      entity_type: 'change_order',
      entity_id: changeOrder.id,
      metadata: {
        previous_status: existing.status,
        status: changeOrder.status,
        amount_delta: changeOrder.amount_delta,
      },
    });

    if (existing.status !== 'sent' && changeOrder.status === 'sent') {
      await notifyChangeOrder(auth.sb, changeOrder);
    }

    return NextResponse.json({ changeOrder });
  } catch (error) {
    return internalError(error, 'change_orders.update');
  }
}
