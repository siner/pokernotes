import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Sparkles, Calculator, WifiOff, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.hero' });

  return {
    title: 'PokerReads — Live Poker Player Notes & Calculators',
    description: t('subtitle'),
  };
}

export default async function HomePage() {
  const t = await getTranslations('landing');

  return (
    <main>
      {/* Hero */}
      <section className="relative px-6 py-20 lg:py-32">
        {/* Background glows — contained so they don't cause overflow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/6 blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 h-72 w-72 rounded-full bg-teal-500/5 blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Left: copy */}
            <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
              {/* Badges */}
              <div className="mb-6 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 font-mono text-xs font-medium text-emerald-400">
                  EN / ES
                </span>
                <span className="rounded-full border border-slate-700 bg-slate-800/50 px-3 py-1 font-mono text-xs font-medium text-slate-400">
                  {t('hero.badgeFree')}
                </span>
              </div>

              {/* Headline */}
              <h1 className="mb-5 max-w-xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.25rem]">
                <span className="text-white">{t('hero.title').split('.')[0]}.</span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {t('hero.title').split('.').slice(1).join('.').trim()}
                </span>
              </h1>

              {/* Subtitle */}
              <p className="mb-10 max-w-md text-balance text-lg leading-relaxed text-slate-400">
                {t('hero.subtitle')}
              </p>

              {/* CTAs */}
              <div className="flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                <Link
                  href="/notes"
                  className="group inline-flex min-h-[48px] min-w-[180px] items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 active:scale-[0.97]"
                >
                  {t('hero.cta')}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/tools/pot-odds"
                  className="inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-300 transition-all hover:border-slate-600 hover:bg-slate-700/50 hover:text-white active:scale-[0.97]"
                >
                  {t('hero.secondaryCta')}
                </Link>
              </div>

              {/* Feature pills */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5 lg:justify-start">
                {(t.raw('hero.pills') as string[]).map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1 font-mono text-xs text-slate-500"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: product mockup — padding contains the floating cards */}
            <div className="hidden lg:block">
              <div className="relative mx-auto max-w-sm px-8 pb-6 pt-10">
                {/* Floating: Pot Odds — top-right */}
                <div className="absolute right-0 top-0 z-10 rounded-xl border border-slate-700/60 bg-[#060d08] p-3 shadow-xl ring-1 ring-white/5">
                  <p className="mb-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Pot Odds
                  </p>
                  <p className="font-mono text-2xl font-bold leading-none text-emerald-400">
                    33.3%
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-slate-600">required equity</p>
                </div>

                {/* Main player note card */}
                <div className="relative rounded-2xl border border-slate-700/60 bg-slate-900/80 p-5 shadow-2xl shadow-black/50 ring-1 ring-white/5 backdrop-blur-sm">
                  {/* Card header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                        Player
                      </p>
                      <h3 className="mt-0.5 text-base font-semibold text-white">Big Stack Barry</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/60" />
                      <span className="font-mono text-xs text-emerald-400">Table 4 · Seat 6</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mb-4 flex flex-wrap gap-1.5">
                    {['aggro', '3bet-happy', 'overbet'].map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[11px] text-emerald-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mb-4 h-px bg-slate-800" />

                  {/* AI Summary */}
                  <div className="rounded-xl border border-slate-800 bg-slate-800/40 p-3.5">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3 text-emerald-400" />
                      <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                        AI Summary
                      </p>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-300">
                      Bets large on wet boards, folds to check-raises. Opens wide from BTN. Watch
                      for river bluffs with missed draws.
                    </p>
                  </div>

                  {/* Mock actions */}
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="flex cursor-default items-center justify-center rounded-lg border border-slate-700 bg-slate-800/40 py-2.5 font-mono text-xs text-slate-400">
                      Edit note
                    </div>
                    <div className="flex cursor-default items-center justify-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 py-2.5 font-mono text-xs text-emerald-400">
                      <Sparkles className="h-3 w-3" />
                      Structure
                    </div>
                  </div>
                </div>

                {/* Floating: Push/Fold — bottom-left */}
                <div className="absolute bottom-0 left-0 z-10 rounded-xl border border-slate-700/60 bg-[#060d08] p-3 shadow-xl ring-1 ring-white/5">
                  <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    Push/Fold
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-white">A7o</span>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400">
                      PUSH ≤9BB
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-800/60 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-14 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('features.sectionTitle')}
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-emerald-500/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 transition-transform duration-300 group-hover:scale-110">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-100">
                {t('features.aiNotes.title')}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {t('features.aiNotes.description')}
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all duration-300 hover:border-teal-500/30 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-teal-500/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400 transition-transform duration-300 group-hover:scale-110">
                <Calculator className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-100">
                {t('features.calculators.title')}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {t('features.calculators.description')}
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-6 transition-all duration-300 hover:border-slate-600/50 hover:bg-slate-900/80 hover:shadow-lg hover:shadow-slate-500/5">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700/40 text-slate-300 transition-transform duration-300 group-hover:scale-110">
                <WifiOff className="h-5 w-5" />
              </div>
              <h3 className="mb-2 text-base font-semibold text-slate-100">
                {t('features.offline.title')}
              </h3>
              <p className="text-sm leading-relaxed text-slate-500">
                {t('features.offline.description')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
