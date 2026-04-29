import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { AppDB } from '@/lib/db';
import * as schema from '@/lib/db/schema';
import { sendEmail } from '@/lib/email';

interface AuthEnv {
  RATE_LIMITS?: KVNamespace;
}

/**
 * Wraps a Cloudflare KV namespace as Better Auth secondary storage. Used for
 * rate limit counters; Workers don't share in-memory state across instances,
 * so the default in-memory rate limiter would be a no-op in production.
 */
function kvSecondaryStorage(kv: KVNamespace) {
  return {
    async get(key: string) {
      return kv.get(key);
    },
    async set(key: string, value: string, ttl?: number) {
      if (ttl && ttl > 0) {
        // Cloudflare KV requires expirationTtl >= 60s; Better Auth uses shorter
        // windows (e.g. 10s) for rate limit counters. Clamping widens the window
        // slightly, which only makes rate limiting stricter — acceptable.
        await kv.put(key, value, { expirationTtl: Math.max(ttl, 60) });
      } else {
        await kv.put(key, value);
      }
    },
    async delete(key: string) {
      await kv.delete(key);
    },
  };
}

function resolveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_SECRET is required in production. ' +
        'Set it via `wrangler secret put BETTER_AUTH_SECRET`.'
    );
  }
  return 'dev-secret-change-me';
}

export function getAuth(db: AppDB, env?: AuthEnv) {
  const kv = env?.RATE_LIMITS;
  return betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    secret: resolveSecret(),
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.authSessions,
        account: schema.authAccounts,
        verification: schema.authVerifications,
      },
    }),
    user: {
      additionalFields: {
        tier: {
          type: 'string',
          required: false,
          defaultValue: 'free',
          input: false,
        },
        preferredLocale: {
          type: 'string',
          required: false,
          defaultValue: 'en',
          input: false,
        },
        stripeCustomerId: {
          type: 'string',
          required: false,
          input: false,
        },
        stripeSubscriptionId: {
          type: 'string',
          required: false,
          input: false,
        },
        subscriptionStatus: {
          type: 'string',
          required: false,
          input: false,
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }) => {
        await sendEmail({
          to: user.email,
          subject: 'Reset your PokerReads password',
          text: [
            `Hi${user.name ? ' ' + user.name : ''},`,
            '',
            'You requested to reset your PokerReads password. Open this link to choose a new one (expires in 1 hour):',
            '',
            url,
            '',
            "If you didn't ask for this, you can safely ignore this email — your password won't change.",
            '',
            '— PokerReads',
          ].join('\n'),
        });
      },
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    session: {
      // Signed cookie that lets Better Auth skip the D1 lookup on most reads.
      // Worker pricing is per-CPU-ms so saving the round-trip pays off; 5min
      // is short enough that revoke-on-password-reset still flushes promptly.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
      ...(kv && { storeSessionInDatabase: true }),
    },
    // KV-backed rate limiter. Defaults to memory which is a no-op on Workers.
    // Sessions stay in D1 (storeSessionInDatabase) — only rate counters use KV.
    ...(kv && {
      secondaryStorage: kvSecondaryStorage(kv),
      rateLimit: {
        enabled: true,
        storage: 'secondary-storage' as const,
      },
    }),
  });
}

export type Auth = ReturnType<typeof getAuth>;
