import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { AppDB } from '@/lib/db';
import * as schema from '@/lib/db/schema';

export function getAuth(db: AppDB) {
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
  });
}

export type Auth = ReturnType<typeof getAuth>;
