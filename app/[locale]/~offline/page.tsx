import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Offline | PokerNotes',
};

export default async function OfflinePage() {
  const t = await getTranslations('common.offline');

  return (
    <main className="flex min-h-[calc(100dvh-3.5rem)] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-slate-800/50">
        <WifiOff className="h-10 w-10 text-slate-400" />
      </div>

      <h1 className="mb-3 text-3xl font-bold tracking-tight text-slate-100 sm:text-4xl">
        {t('title')}
      </h1>

      <p className="mb-8 max-w-sm text-lg text-slate-400">{t('description')}</p>

      {/* When the user clicks try again, we simply reload the browser to re-attempt the network fetch */}
      <button
        type="button"
        className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-400/30 active:scale-95"
      >
        {t('cta')}
      </button>

      <script
        dangerouslySetInnerHTML={{
          __html: `document.querySelector('button').addEventListener('click', () => window.location.reload())`,
        }}
      />
    </main>
  );
}
