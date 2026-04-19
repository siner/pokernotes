import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsClient } from './SettingsClient';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { Suspense } from 'react';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'settings' });

  return {
    title: t('metaTitle'),
  };
}

export default async function SettingsPage() {
  let tier = 'free';

  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDb(env.DB);
    const auth = getAuth(db);
    const session = await auth.api.getSession({ headers: await headers() });

    if (session?.user) {
      const dbUser = await db.select({ tier: users.tier }).from(users).where(eq(users.id, session.user.id)).get();
      if (dbUser) {
        tier = dbUser.tier;
      }
    }
  } catch (error) {
    console.error('Failed to fetch user tier:', error);
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <Suspense fallback={<div className="h-[50vh] flex items-center justify-center">Cargando...</div>}>
        <SettingsClient initialTier={tier} />
      </Suspense>
    </main>
  );
}
