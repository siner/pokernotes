import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import Stripe from 'stripe';

export async function POST() {
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
      return Response.json({ error: 'Stripe configuration missing' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey);

    // Fetch the customer ID from the database
    const userRecord = await db
      .select({ stripeCustomerId: users.stripeCustomerId })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (!userRecord?.stripeCustomerId) {
      return Response.json({ error: 'No Stripe customer found' }, { status: 404 });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userRecord.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    });

    return Response.json({ url: portalSession.url });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
