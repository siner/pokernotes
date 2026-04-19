import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SessionDetail } from '@/components/session/SessionDetail';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'session.detail' });

  return {
    title: t('metaTitle', { name: '…' }),
  };
}

export default async function SessionDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <SessionDetail sessionId={id} />
    </main>
  );
}
