import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const stripeKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      console.error('Missing Stripe server configuration');
      return Response.json({ error: 'Webhook Error: Missing config' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey);
    const signature = request.headers.get('stripe-signature') as string;
    const body = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret as string);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error(`Webhook signature verification failed.`, errorMessage);
      return Response.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    const db = getDb(env.DB);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // The client_reference_id contains our internal user ID
        const userId = session.client_reference_id;
        if (!userId) {
          console.error('No client_reference_id found in checkout session');
          break;
        }

        // Ensure we save the customer ID and immediately upgrade them to avoid race conditions.
        // We use insert().onConflictDoUpdate() because the row in `users` might not exist yet if BetterAuth hasn't synced it.
        if (session.customer) {
          const email =
            session.customer_email ||
            session.customer_details?.email ||
            `temp-${userId}@pokerreads.invalid`;

          await db
            .insert(users)
            .values({
              id: userId,
              email: email,
              stripeCustomerId: session.customer as string,
              tier: 'pro',
              subscriptionStatus: 'active',
            })
            .onConflictDoUpdate({
              target: users.id,
              set: {
                stripeCustomerId: session.customer as string,
                tier: 'pro',
                subscriptionStatus: 'active',
              },
            });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const status = subscription.status;
        const tier = status === 'active' || status === 'trialing' ? 'pro' : 'free';

        await db
          .update(users)
          .set({
            stripeSubscriptionId: subscription.id,
            subscriptionStatus: status,
            tier: tier,
          })
          .where(eq(users.stripeCustomerId, customerId));
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db
          .update(users)
          .set({
            subscriptionStatus: 'canceled',
            tier: 'free',
          })
          .where(eq(users.stripeCustomerId, customerId));
        break;
      }

      case 'invoice.payment_failed': {
        // Renewal failed. Mark past_due but keep tier=pro — Stripe retries over
        // the dunning window, and on final failure sends subscription.deleted
        // which downgrades. Auto-downgrading on first failure punishes users
        // for transient card issues.
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        if (customerId) {
          await db
            .update(users)
            .set({ subscriptionStatus: 'past_due' })
            .where(eq(users.stripeCustomerId, customerId));
        }
        break;
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
