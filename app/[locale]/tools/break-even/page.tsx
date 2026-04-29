import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { BreakEvenCalc } from '@/components/tools/BreakEvenCalc';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.breakEven' });

  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function BreakEvenPage() {
  const t = await getTranslations('tools.breakEven');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: t('title'),
    description: t('metaDescription'),
    applicationCategory: 'FinanceApplication',
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
        <h1 className="mb-2 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          {t('title')}
        </h1>
        <p className="text-pretty text-base text-slate-400 sm:text-lg">{t('metaDescription')}</p>
      </header>

      <main>
        <BreakEvenCalc />
      </main>

      <section className="prose prose-invert prose-emerald mt-12 max-w-none text-slate-300">
        <h2>{t('howTo')}</h2>
        <p>{t('desc1')}</p>
        <ul>
          <li>
            <strong>{t('li1title')}:</strong> {t('li1')}
          </li>
          <li>
            <strong>{t('li2title')}:</strong> {t('li2')}
          </li>
        </ul>
        <p>{t('desc2')}</p>
      </section>
    </div>
  );
}
