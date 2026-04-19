import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { HandRankings } from '@/components/tools/HandRankings';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.handRankings' });

  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function HandRankingsPage() {
  const t = await getTranslations('tools.handRankings');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('title'),
    description: t('metaDescription'),
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-slate-400">{t('metaDescription')}</p>
      </header>

      <main>
        <HandRankings />
      </main>
    </div>
  );
}
