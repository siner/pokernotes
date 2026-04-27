import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import {
  authAccounts,
  authSessions,
  authUsers,
  notes,
  players,
  pokerSessions,
  users,
} from '@/lib/db/schema';
import { logger } from '@/lib/logger';

const ROUTE = 'account.delete';

async function deleteAllR2Photos(bucket: R2Bucket, userId: string): Promise<void> {
  const prefix = `users/${userId}/`;
  let cursor: string | undefined;
  do {
    const list = await bucket.list({ prefix, cursor });
    if (list.objects.length > 0) {
      await Promise.all(list.objects.map((o) => bucket.delete(o.key)));
    }
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
}

export async function DELETE() {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const auth = getAuth(db, env);

  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;

  // 1. Cancel Stripe subscription (best effort — don't block account deletion).
  const userRecord = await db
    .select({
      stripeSubscriptionId: users.stripeSubscriptionId,
      stripeCustomerId: users.stripeCustomerId,
    })
    .from(users)
    .where(eq(users.id, userId))
    .get();

  const stripeKey = process.env.STRIPE_SECRET_KEY || env.STRIPE_SECRET_KEY;
  if (stripeKey && userRecord) {
    const stripe = new Stripe(stripeKey);
    if (userRecord.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(userRecord.stripeSubscriptionId);
      } catch (err) {
        logger.warn('stripe subscription cancel failed', { route: ROUTE, userId }, err);
      }
    }
    if (userRecord.stripeCustomerId) {
      try {
        await stripe.customers.del(userRecord.stripeCustomerId);
      } catch (err) {
        logger.warn('stripe customer delete failed', { route: ROUTE, userId }, err);
      }
    }
  }

  // 2. Delete all R2 photos under users/{userId}/.
  try {
    await deleteAllR2Photos(env.PLAYER_PHOTOS, userId);
  } catch (err) {
    logger.warn('R2 cleanup failed', { route: ROUTE, userId }, err);
  }

  // 3. Delete D1 records in dependency order. D1 doesn't enforce FKs by default,
  //    so cascades from authUsers can't be relied upon — delete explicitly.
  await db.delete(notes).where(eq(notes.userId, userId));
  await db.delete(players).where(eq(players.userId, userId));
  await db.delete(pokerSessions).where(eq(pokerSessions.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
  await db.delete(authAccounts).where(eq(authAccounts.userId, userId));
  await db.delete(authSessions).where(eq(authSessions.userId, userId));
  await db.delete(authUsers).where(eq(authUsers.id, userId));

  logger.info('account deleted', { route: ROUTE, userId });
  return Response.json({ ok: true });
}
