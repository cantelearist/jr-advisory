/* ── Stripe Checkout Session — creates payment link for an invoice ── */
/* POST /api/payments/checkout { invoice_id } */
/* Requires auth: admin or the invoice's client */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import Stripe from 'stripe';
import { internalError } from '@/lib/api-error';
import { fetchApprovedChangeOrderDelta } from '@/lib/change-orders';

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.jamesroman.la';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY not configured');
  return new Stripe(key);
}

export async function POST(req: NextRequest) {
  /* Rate limit: 10 checkout attempts per minute per IP */
  const rl = checkRateLimit(getClientIp(req), 'checkout', { windowMs: 60_000, maxAttempts: 10 });
  if (!rl.allowed) {
    return NextResponse.json({ error: rl.message || 'Too many requests' }, { status: 429 });
  }

  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  let stripe: Stripe;
  try {
    stripe = getStripe();
  } catch {
    return NextResponse.json({ error: 'Stripe not configured. Add STRIPE_SECRET_KEY in Vercel env vars.' }, { status: 503 });
  }

  const { sb, isAdmin } = auth;

  try {
    const body = await req.json();
    const invoiceId = typeof body?.invoice_id === 'string' ? body.invoice_id.trim() : '';
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });
    }

    // Fetch invoice + client
    const { data: invoice, error: invErr } = await sb
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (invErr || !invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Non-admin: verify ownership
    if (!isAdmin) {
      const { data: clientRec } = await sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .single();

      if (!clientRec || clientRec.id !== invoice.client_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    if (invoice.status === 'draft') {
      return NextResponse.json({ error: 'Draft invoices cannot be paid' }, { status: 400 });
    }
    if (invoice.status !== 'sent' && invoice.status !== 'overdue') {
      return NextResponse.json({ error: 'Invoice is not payable' }, { status: 400 });
    }

    const approvedDelta = await fetchApprovedChangeOrderDelta(sb, invoice.id);
    const revisedAmount = Number(invoice.amount) + approvedDelta;
    const amountInCents = Math.round(revisedAmount * 100);
    if (!Number.isSafeInteger(amountInCents) || amountInCents < 50) {
      return NextResponse.json({ error: 'Invoice amount is not payable online' }, { status: 400 });
    }

    const { data: client } = await sb
      .from('clients')
      .select('name, email')
      .eq('id', invoice.client_id)
      .single();

    // Reuse the current open Checkout session. This avoids multiple valid
    // payment links for one invoice and reduces the risk of duplicate payment.
    if (invoice.stripe_session_id) {
      try {
        const existingSession = await stripe.checkout.sessions.retrieve(invoice.stripe_session_id);
        if (existingSession.status === 'open' && existingSession.url) {
          return NextResponse.json({ url: existingSession.url, reused: true });
        }
        if (existingSession.status === 'complete' && existingSession.payment_status === 'paid') {
          return NextResponse.json(
            { error: 'Payment is being confirmed. Refresh the invoice shortly.' },
            { status: 409 },
          );
        }
      } catch {
        // Missing or expired Stripe sessions are replaced below.
      }
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ['card'],
        mode: 'payment',
        client_reference_id: invoice.id,
        customer_email: client?.email || undefined,
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          client_id: invoice.client_id,
          engagement_id: invoice.engagement_id,
          original_amount: String(invoice.amount),
          approved_change_orders: String(approvedDelta),
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              unit_amount: amountInCents,
              product_data: {
                name: `Invoice ${invoice.invoice_number}`,
                description: approvedDelta === 0
                  ? invoice.description
                  : `${invoice.description} · includes approved change orders`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${baseUrl}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/portal/invoices`,
      },
      {
        idempotencyKey: `invoice:${invoice.id}:${invoice.updated_at || invoice.created_at}`,
      },
    );

    // Store session ID on invoice
    const { error: sessionStoreError } = await sb
      .from('invoices')
      .update({ stripe_session_id: session.id })
      .eq('id', invoice.id);
    if (sessionStoreError) {
      try {
        await stripe.checkout.sessions.expire(session.id);
      } catch {
        // The database failure is the actionable error.
      }
      return internalError(sessionStoreError, 'payments.checkout.store_session');
    }

    // Audit log
    await sb.from('audit_log').insert({
      action: 'checkout_created',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: {
        invoice_number: invoice.invoice_number,
        original_amount: invoice.amount,
        approved_change_orders: approvedDelta,
        revised_amount: revisedAmount,
        session_id: session.id,
      },
    }).then(() => {});

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error('Checkout error:', e);
    return internalError(e, 'payments.checkout');
  }
}
