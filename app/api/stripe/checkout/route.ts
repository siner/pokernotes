import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const ROUTE = 'stripe.checkout';
const TRIAL_DAYS = 7;

const checkoutBodySchema = z
  .object({
    billingPeriod: z.enum(['monthly', 'yearly']).default('monthly'),
  })
  .default({ billingPeriod: 'monthly' });

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
      logger.error('missing STRIPE_SECRET_KEY', { route: ROUTE });
      return Response.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });

    let parsedBody: z.infer<typeof checkoutBodySchema>;
    try {
      const raw = (await request.json().catch(() => ({}))) as unknown;
      parsedBody = checkoutBodySchema.parse(raw);
    } catch (error) {
      logger.warn('invalid checkout body', { route: ROUTE }, error);
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { billingPeriod } = parsedBody;
    const priceId =
      billingPeriod === 'yearly'
        ? process.env.STRIPE_PRO_PRICE_ID_YEARLY || env.STRIPE_PRO_PRICE_ID_YEARLY || ''
        : process.env.STRIPE_PRO_PRICE_ID_MONTHLY || env.STRIPE_PRO_PRICE_ID_MONTHLY || '';

    if (!priceId) {
      logger.error('missing Stripe price ID for billing period', {
        route: ROUTE,
        userId: session.user.id,
        billingPeriod,
      });
      return Response.json({ error: 'Stripe price not configured' }, { status: 500 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Reuse the Stripe customer if we already created one for this user
    // (e.g. they cancelled and are resubscribing). Passing customer_email
    // instead would create a duplicate Customer record on Stripe's side.
    const existing = await db
      .select({
        stripeCustomerId: users.stripeCustomerId,
        tier: users.tier,
      })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    // Only offer the trial to genuinely new subscribers. Returning users who
    // already had Pro shouldn't get another free week each time they re-up.
    const eligibleForTrial = !existing?.stripeCustomerId && existing?.tier !== 'pro';

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
      ...(eligibleForTrial ? { subscription_data: { trial_period_days: TRIAL_DAYS } } : {}),
      ...(existing?.stripeCustomerId
        ? { customer: existing.stripeCustomerId }
        : { customer_email: session.user.email }),
    });

    return Response.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error('checkout handler crashed', { route: ROUTE }, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
