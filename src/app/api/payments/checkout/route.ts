/* ── Stripe Checkout Session — creates payment link for an invoice ── */
/* POST /api/payments/checkout { invoice_id } */
/* Requires auth: admin or the invoice's client */

import { type NextRequest, NextResponse } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import Stripe from 'stripe';
import { internalError } from '@/lib/api-error';

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
    const { invoice_id } = await req.json();
    if (!invoice_id) {
      return NextResponse.json({ error: 'invoice_id required' }, { status: 400 });
    }

    // Fetch invoice + client
    const { data: invoice, error: invErr } = await sb
      .from('invoices')
      .select('*')
      .eq('id', invoice_id)
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

    const { data: client } = await sb
      .from('clients')
      .select('name, email')
      .eq('id', invoice.client_id)
      .single();

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      client_reference_id: invoice.id,
      customer_email: client?.email || undefined,
      metadata: {
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        client_id: invoice.client_id,
        engagement_id: invoice.engagement_id,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(Number(invoice.amount) * 100),
            product_data: {
              name: `Invoice ${invoice.invoice_number}`,
              description: invoice.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}&invoice=${invoice.invoice_number}`,
      cancel_url: `${baseUrl}/portal/invoices`,
    });

    // Store session ID on invoice
    await sb
      .from('invoices')
      .update({ stripe_session_id: session.id })
      .eq('id', invoice.id);

    // Audit log
    await sb.from('audit_log').insert({
      action: 'checkout_created',
      entity_type: 'invoice',
      entity_id: invoice.id,
      metadata: { invoice_number: invoice.invoice_number, amount: invoice.amount, session_id: session.id },
    }).then(() => {});

    return NextResponse.json({ url: session.url });
  } catch (e: unknown) {
    console.error('Checkout error:', e);
    return internalError(e, 'payments.checkout');
  }
}
