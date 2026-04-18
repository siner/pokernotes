import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

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
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        textAlign: 'center',
        gap: '1.5rem',
      }}
    >
      <h1
        style={{
          fontSize: 'clamp(1.75rem, 5vw, 3rem)',
          fontWeight: 700,
          lineHeight: 1.2,
          maxWidth: '36rem',
        }}
      >
        {t('title')}
      </h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: 'var(--muted-foreground)',
          maxWidth: '32rem',
        }}
      >
        {t('subtitle')}
      </p>
      <a
        href="#"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.75rem 1.5rem',
          backgroundColor: 'var(--brand)',
          color: 'var(--brand-foreground)',
          borderRadius: 'var(--radius)',
          fontWeight: 600,
          textDecoration: 'none',
          minHeight: '44px',
        }}
      >
        {t('cta')}
      </a>
    </main>
  );
}
