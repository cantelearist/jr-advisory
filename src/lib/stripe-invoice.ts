export async function invalidateOpenCheckoutSession(sessionId: string): Promise<void> {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('Stripe must be configured before changing a payable balance');
  }

  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(stripeKey);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (session.status === 'open') {
    await stripe.checkout.sessions.expire(sessionId);
  }
}
