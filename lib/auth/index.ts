import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { AppDB } from '@/lib/db';
import * as schema from '@/lib/db/schema';

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

export function getAuth(db: AppDB, env?: AuthEnv) {
  const kv = env?.RATE_LIMITS;
  return betterAuth({
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-me',
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.authUsers,
        session: schema.authSessions,
        account: schema.authAccounts,
        verification: schema.authVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
    },
    // KV-backed rate limiter. Defaults to memory which is a no-op on Workers.
    // Sessions stay in D1 (storeSessionInDatabase) — only rate counters use KV.
    ...(kv && {
      secondaryStorage: kvSecondaryStorage(kv),
      session: { storeSessionInDatabase: true },
      rateLimit: {
        enabled: true,
        storage: 'secondary-storage' as const,
      },
    }),
  });
}

export type Auth = ReturnType<typeof getAuth>;
