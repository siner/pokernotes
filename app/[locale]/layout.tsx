import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Syne } from 'next/font/google';
import { Spade } from 'lucide-react';
import { routing } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { PwaInstallPrompt } from '@/components/PwaInstallPrompt';
import { Footer } from '@/components/Footer';
import { UserMenu } from '@/components/auth/UserMenu';
import { SyncBootstrap } from '@/components/SyncBootstrap';
import { SyncIndicator } from '@/components/SyncIndicator';
import '@/app/globals.css';

const syne = Syne({
  subsets: ['latin'],
  variable: '--font-syne',
  display: 'swap',
});

type Locale = (typeof routing.locales)[number];

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'landing.hero' });
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokerreads.app';

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: 'PokerReads — Live Poker Player Notes & Calculators',
      template: '%s | PokerReads',
    },
    description: t('subtitle'),
    manifest: '/manifest.json',
    alternates: {
      canonical: './',
      languages: {
        en: '/en',
        es: '/es',
        'x-default': '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'es' ? 'es_ES' : 'en_US',
      url: baseUrl,
      siteName: 'PokerReads',
      title: 'PokerReads — Live Poker Player Notes & Calculators',
      description: t('subtitle'),
      // images injected automatically by app/[locale]/opengraph-image.tsx
    },
    twitter: {
      card: 'summary_large_image',
      title: 'PokerReads — Live Poker Player Notes & Calculators',
      description: t('subtitle'),
      // image inherited from openGraph (Next.js falls back when twitter-image absent)
    },
    icons: {
      icon: [
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/icons/icon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
      apple: '/icons/apple-touch-icon.png',
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: 'nav' });

  return (
    <html lang={locale} suppressHydrationWarning className={`dark ${syne.variable}`}>
      <body className="min-h-dvh bg-[#060d08] text-slate-100 antialiased flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center border-b border-white/5 bg-[#060d08]/90 px-4 backdrop-blur-md sm:px-6">
            <Link
              href="/"
              aria-label="PokerReads"
              className="mr-6 flex items-center gap-2.5 transition-opacity hover:opacity-80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white">
                <Spade className="h-4 w-4 fill-current" />
              </span>
              <span className="font-display text-sm font-bold tracking-tight text-white hidden sm:inline-block">
                PokerReads
              </span>
            </Link>
            <nav className="flex flex-1 items-center gap-0.5 sm:gap-2">
              <Link
                href="/tools/pot-odds"
                className="rounded-lg px-2 sm:px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {t('tools')}
              </Link>
              <Link
                href="/pricing"
                className="rounded-lg px-2 sm:px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {t('pricing')}
              </Link>
            </nav>
            <div className="flex items-center gap-1.5 sm:gap-3">
              <SyncIndicator />
              <LanguageSwitcher />
              <div className="h-5 w-px bg-white/10 hidden sm:block"></div>
              <UserMenu />
            </div>
          </header>
          <main className="pt-14 flex-1 flex flex-col">{children}</main>
          <Footer />
          <PwaInstallPrompt />
          <SyncBootstrap />
        </NextIntlClientProvider>
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <Script
            id="cf-beacon"
            strategy="afterInteractive"
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={JSON.stringify({
              token: process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN,
            })}
          />
        )}
      </body>
    </html>
  );
}
