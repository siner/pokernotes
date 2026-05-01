import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HandsList } from '@/components/hands/HandsList';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'hands.list' });

  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default function HandsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <HandsList />
    </main>
  );
}
