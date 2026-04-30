import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HandDetail } from '@/components/hands/HandDetail';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hands.detail' });

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function HandDetailPage({ params }: Props) {
  const { id } = await params;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <HandDetail handId={id} />
    </main>
  );
}
