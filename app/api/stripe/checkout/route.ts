import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDb(env.DB);
    const auth = getAuth(db);

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

    // @ts-ignore - Ignore apiVersion warning, it defaults correctly but TS complains based on version
    const stripe = new Stripe(stripeKey as string);

    let priceId = '';
    try {
      const body = (await request.json()) as { priceId?: string };
      if (body.priceId) priceId = body.priceId;
    } catch {
      // fallback
    }
    
    if (!priceId) {
      // Provide a dev fallback or expect it from request
      priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_12345';
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

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
      customer_email: session.user.email,
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
