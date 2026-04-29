import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { processedStripeEvents, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import Stripe from 'stripe';
import { logger } from '@/lib/logger';
import { sendEmail } from '@/lib/email';
import { welcomeProTemplate } from '@/lib/email/templates';

const ROUTE = 'stripe.webhook';

export async function POST(request: Request) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    const stripeKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey || !webhookSecret) {
      logger.error('missing stripe server configuration', { route: ROUTE });
      return Response.json({ error: 'Webhook Error: Missing config' }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' });
    const signature = request.headers.get('stripe-signature') as string;
    const body = await request.text();

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret as string);
    } catch (err) {
      logger.error('webhook signature verification failed', { route: ROUTE }, err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      return Response.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
    }

    const db = getDb(env.DB);

    // Idempotency: claim the event ID first. Stripe retries the same event on
    // 5xx; without this, retries would re-run the side effects. Handlers below
    // are individually idempotent (upserts), but this avoids wasted work and
    // gives us an audit trail. On processing failure we delete the claim so
    // Stripe's next retry can re-process.
    const claim = await db
      .insert(processedStripeEvents)
      .values({ eventId: event.id, processedAt: new Date() })
      .onConflictDoNothing()
      .returning({ eventId: processedStripeEvents.eventId });

    if (claim.length === 0) {
      logger.info('event already processed', {
        route: ROUTE,
        eventId: event.id,
        eventType: event.type,
      });
      return Response.json({ received: true, deduplicated: true });
    }

    try {
      await processEvent(db, event);
      logger.info('event processed', {
        route: ROUTE,
        eventId: event.id,
        eventType: event.type,
      });
    } catch (err) {
      // Roll back the claim so the next Stripe retry can re-process.
      await db.delete(processedStripeEvents).where(eq(processedStripeEvents.eventId, event.id));
      logger.error(
        'event processing failed; claim rolled back',
        { route: ROUTE, eventId: event.id, eventType: event.type },
        err
      );
      throw err;
    }

    return Response.json({ received: true });
  } catch (error) {
    logger.error('webhook handler crashed', { route: ROUTE }, error);
    return Response.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

type Db = ReturnType<typeof getDb>;

async function processEvent(db: Db, event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;

      // The client_reference_id contains our internal user ID
      const userId = session.client_reference_id;
      if (!userId) {
        logger.error('checkout.session.completed missing client_reference_id', {
          route: ROUTE,
          eventId: event.id,
        });
        break;
      }

      if (session.customer) {
        await db
          .update(users)
          .set({
            stripeCustomerId: session.customer as string,
            tier: 'pro',
            subscriptionStatus: 'active',
          })
          .where(eq(users.id, userId));

        // Welcome email. Email failures must NOT roll back the upgrade —
        // Stripe would retry the entire event and re-fire side effects.
        try {
          const [user] = await db
            .select({
              email: users.email,
              name: users.name,
              preferredLocale: users.preferredLocale,
            })
            .from(users)
            .where(eq(users.id, userId));
          if (user?.email) {
            const tpl = welcomeProTemplate(user.preferredLocale, { name: user.name });
            await sendEmail({ to: user.email, ...tpl });
          }
        } catch (err) {
          logger.error(
            'welcome email send failed',
            { route: ROUTE, eventId: event.id, userId },
            err
          );
        }
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
          tier,
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
}
