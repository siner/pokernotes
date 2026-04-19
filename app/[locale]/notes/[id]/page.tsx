import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PlayerDetail } from '@/components/notes/PlayerDetail';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notes.detail' });

  return {
    title: t('metaTitle', { name: '…' }),
  };
}

export default async function PlayerDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <PlayerDetail playerId={id} />
    </main>
  );
}
