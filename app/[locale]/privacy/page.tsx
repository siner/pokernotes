import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });

  return {
    title: t('title'),
    description: t('metaDescription'),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-2xl border border-white/5 bg-[#0a110d] p-8 shadow-xl">
        <h1 className="mb-6 font-display text-3xl font-bold tracking-tight text-white">
          {t('title')}
        </h1>
        <div className="prose prose-invert prose-emerald max-w-none text-slate-300">
          <p className="text-lg leading-relaxed">{t('content')}</p>
          <hr className="my-8 border-white/5" />
          <p className="text-sm text-slate-500 italic">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </main>
  );
}
