'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { UpgradeButton } from '@/components/pricing/UpgradeButton';

type BillingPeriod = 'monthly' | 'yearly';

export function PricingPlans() {
  const t = useTranslations('pricing');
  const [period, setPeriod] = useState<BillingPeriod>('yearly');

  const isYearly = period === 'yearly';
  const price = isYearly ? t('pro.priceYearly') : t('pro.priceMonthly');
  const periodSuffix = isYearly ? t('pro.priceYearlyPeriod') : t('pro.priceMonthlyPeriod');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <p className="mx-auto mb-8 inline-block rounded-full border border-emerald-500/30 bg-emerald-950/30 px-4 py-2 text-sm font-medium text-emerald-300">
        {t('trialBanner')}
      </p>

      <div className="mb-12 flex justify-center">
        <div
          role="tablist"
          aria-label={t('billing.monthly') + ' / ' + t('billing.yearly')}
          className="inline-flex rounded-full border border-slate-800 bg-slate-900/60 p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isYearly}
            onClick={() => setPeriod('monthly')}
            className={`min-h-11 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              !isYearly
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t('billing.monthly')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isYearly}
            onClick={() => setPeriod('yearly')}
            className={`min-h-11 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
              isYearly ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="flex items-center gap-2">
              {t('billing.yearly')}
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                {t('billing.savings')}
              </span>
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:px-12">
        {/* Free Tier */}
        <div className="flex flex-col rounded-3xl border border-slate-800 bg-slate-900/50 p-8 text-left shadow-2xl">
          <h2 className="text-xl font-semibold text-slate-200">{t('free.name')}</h2>
          <div className="my-4 flex items-baseline text-5xl font-extrabold text-white">
            {t('free.amount')}
          </div>
          <p className="mb-6 text-sm text-slate-400">{t('free.tagline')}</p>
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
          <button
            type="button"
            disabled
            className="min-h-11 w-full rounded-xl border border-slate-700 bg-slate-800 py-3 font-semibold text-white transition-colors hover:bg-slate-700"
          >
            {t('free.cta')}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="relative flex flex-col rounded-3xl border border-emerald-500/30 bg-emerald-950/20 p-8 text-left shadow-2xl shadow-emerald-900/20">
          <div className="absolute -top-4 right-8 rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
            {t('pro.badge')}
          </div>
          <h2 className="text-xl font-semibold text-emerald-400">{t('pro.name')}</h2>
          <div className="my-4 flex items-baseline gap-2 text-white">
            <span className="text-5xl font-extrabold">{price}</span>
            <span className="text-lg font-medium text-slate-400">{periodSuffix}</span>
          </div>
          <p className="mb-2 min-h-5 text-sm text-emerald-300">
            {isYearly ? t('pro.priceYearlyEquivalent') : ''}
          </p>
          <p className="mb-6 text-sm text-slate-400">{t('pro.trialNote')}</p>
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
            <li className="flex items-center gap-3">
              <Check className="h-5 w-5 shrink-0 text-emerald-500" />
              <span>{t('pro.feature5')}</span>
            </li>
          </ul>
          <UpgradeButton billingPeriod={period}>{t('pro.cta')}</UpgradeButton>
        </div>
      </div>
    </div>
  );
}
