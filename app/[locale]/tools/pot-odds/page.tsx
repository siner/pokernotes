import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PotOddsCalc } from '@/components/tools/PotOddsCalc';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tools.potOdds' });

  return {
    title: `${t('title')} | PokerNotes`,
    description: t('metaDescription'),
  };
}

export default async function PotOddsPage() {
  const t = await getTranslations('tools.potOdds');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-lg text-slate-400">{t('metaDescription')}</p>
      </header>

      <main>
        <PotOddsCalc />
      </main>

      <section className="prose prose-invert prose-emerald mt-12 max-w-none text-slate-300">
        <h2>{t('howTo')}</h2>
        <p>{t('desc1')}</p>
        <ul>
          <li>
            <strong>{t('li1').split(':')[0]}:</strong>
            {t('li1').split(':')[1]}
          </li>
          <li>
            <strong>{t('li2').split(':')[0]}:</strong>
            {t('li2').split(':')[1]}
          </li>
        </ul>
        <p>{t('desc2')}</p>
      </section>
    </div>
  );
}
