import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.hero' });

  return {
    title: 'PokerNotes — Live Poker Player Notes & Calculators',
    description: t('subtitle'),
  };
}

export default async function HomePage() {
  const t = await getTranslations('landing.hero');

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-16 text-center">
      {/* Badge */}
      <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
          EN / ES
        </span>
        <span className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-400">
          {t('badgeFree')}
        </span>
      </div>

      {/* Headline */}
      <h1 className="mb-4 max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
        <span className="text-slate-100">{t('title').split('.')[0]}.</span>
        <br />
        <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
          {t('title').split('.').slice(1).join('.').trim()}
        </span>
      </h1>

      {/* Subtitle */}
      <p className="mb-10 max-w-md text-balance text-lg leading-relaxed text-slate-400">
        {t('subtitle')}
      </p>

      {/* CTAs */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/notes"
          className="inline-flex min-h-[44px] min-w-[180px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 active:scale-95"
        >
          {t('cta')}
        </Link>
        <Link
          href="/tools/pot-odds"
          className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/50 hover:text-white active:scale-95"
        >
          {t('secondaryCta')}
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {/* Feature pills */}
      <div className="mt-16 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
        {(t.raw('pills') as string[]).map((feature) => (
          <span
            key={feature}
            className="rounded-full border border-slate-800 bg-slate-900 px-3 py-1"
          >
            {feature}
          </span>
        ))}
      </div>
    </main>
  );
}
