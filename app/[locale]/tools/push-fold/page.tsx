import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PushFoldChart } from '@/components/tools/PushFoldChart';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.pushFold' });

  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function PushFoldPage() {
  const t = await getTranslations('tools.pushFold');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('title'),
    description: t('metaDescription'),
    applicationCategory: 'GameApplication',
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
        <PushFoldChart />
      </main>

      <section className="prose prose-invert prose-emerald mt-12 max-w-none text-slate-300">
        <h2>{t('howTo')}</h2>
        <p>{t('desc1')}</p>
        <p>{t('desc2')}</p>
      </section>
    </div>
  );
}
