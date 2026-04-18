import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';

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
    <div className="mx-auto max-w-5xl px-6 py-20 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h1 className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {t('headline')}
      </h1>
      <p className="mx-auto mb-16 max-w-2xl text-lg text-slate-400">{t('subtitle')}</p>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:px-12">
        {/* Free Tier */}
        <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-left shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-200">{t('free.name')}</h2>
          <div className="my-4 flex items-baseline text-5xl font-extrabold text-white">
            $0
            <span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
          </div>
          <p className="mb-6 text-sm text-slate-400">{t('free.price')}</p>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('free.feature1')}</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('free.feature2')}</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('free.feature3', { limit: 15 })}</span>
            </li>
          </ul>
          <button className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 font-semibold text-white transition-colors hover:bg-slate-700">
            {t('free.cta')}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="relative flex flex-col rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-left shadow-2xl shadow-emerald-900/20">
          <div className="absolute -top-4 right-8 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {t('pro.badge')}
          </div>
          <h2 className="text-xl font-semibold text-emerald-400">{t('pro.name')}</h2>
          <div className="my-4 flex items-baseline text-5xl font-extrabold text-white">
            $12
            <span className="ml-1 text-xl font-medium text-slate-500">/mo</span>
          </div>
          <p className="mb-6 text-sm text-slate-400">
            {t('pro.yearly', { price: '144' })} · {t('pro.savings', { percent: '20' })}
          </p>
          <ul className="mb-8 flex-1 space-y-4 text-sm text-slate-300">
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>
                <strong>{t('pro.feature1')}</strong>
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('pro.feature2')}</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('pro.feature3')}</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('pro.feature4')}</span>
            </li>
          </ul>
          <button className="w-full rounded-xl bg-emerald-500 py-3 font-semibold text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 active:scale-95">
            {t('pro.cta')}
          </button>
        </div>
      </div>
    </div>
  );
}
