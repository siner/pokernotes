import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PricingPlans } from '@/components/pricing/PricingPlans';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'pricing' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function PricingPage() {
  const t = await getTranslations('pricing');

  return (
    <div className="mx-auto max-w-5xl px-6 py-20 text-center">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {t('headline')}
      </h1>
      <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-400">{t('subtitle')}</p>
      <PricingPlans />
    </div>
  );
}
