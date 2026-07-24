import { NextResponse, type NextRequest } from 'next/server';
import { requireAuth, isAuthError } from '@/lib/api-auth';
import { internalError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isAuthError(auth)) return auth;

  const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() || '';
  if (!sessionId.startsWith('cs_') || sessionId.length > 255) {
    return NextResponse.json({ error: 'Valid session_id required' }, { status: 400 });
  }

  try {
    const { data: invoice, error } = await auth.sb
      .from('invoices')
      .select('id, client_id, invoice_number, amount, status, paid_date, stripe_session_id')
      .eq('stripe_session_id', sessionId)
      .maybeSingle();
    if (error) return internalError(error, 'payments.status');
    if (!invoice) {
      return NextResponse.json({ error: 'Payment session not found' }, { status: 404 });
    }

    if (!auth.isAdmin) {
      const { data: client } = await auth.sb
        .from('clients')
        .select('id')
        .eq('profile_id', auth.user.id)
        .maybeSingle();
      if (!client || client.id !== invoice.client_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json(
      {
        invoice: {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          amount: invoice.amount,
          status: invoice.status,
          paid_date: invoice.paid_date,
        },
        confirmed: invoice.status === 'paid',
      },
      {
        headers: { 'Cache-Control': 'private, no-store, max-age=0' },
      },
    );
  } catch (error) {
    return internalError(error, 'payments.status');
  }
}
