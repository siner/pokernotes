import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SessionView } from '@/components/session/SessionView';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'session' });

  return {
    title: t('metaTitle'),
  };
}

export default function SessionPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <SessionView />
    </main>
  );
}
