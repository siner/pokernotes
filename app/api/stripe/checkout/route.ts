import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDb(env.DB);
    const auth = getAuth(db, env);

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      console.error('Missing STRIPE_SECRET_KEY');
      return Response.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });

    let priceId = '';
    try {
      const body = (await request.json()) as { priceId?: string };
      if (body.priceId) priceId = body.priceId;
    } catch {
      // No body / not JSON — fall through to env default.
    }

    if (!priceId) {
      priceId =
        process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || '';
    }

    if (!priceId) {
      console.error('Missing NEXT_PUBLIC_STRIPE_PRO_PRICE_ID and no priceId in request body');
      return Response.json({ error: 'Stripe price not configured' }, { status: 500 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Reuse the Stripe customer if we already created one for this user
    // (e.g. they cancelled and are resubscribing). Passing customer_email
    // instead would create a duplicate Customer record on Stripe's side.
    const existing = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/settings?checkout=success`,
      cancel_url: `${appUrl}/pricing?checkout=cancelled`,
      client_reference_id: session.user.id,
      ...(existing?.stripeCustomerId
        ? { customer: existing.stripeCustomerId }
        : { customer_email: session.user.email }),
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
