'use client';

import { Spade } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useSession } from '@/lib/auth/client';
import { useUserTier } from '@/lib/auth/useUserTier';

export function HeaderNav() {
  const t = useTranslations('nav');
  const { data: session } = useSession();
  const { tier } = useUserTier();

  const isAuthed = !!session?.user;
  const isPro = tier === 'pro';

  // Logo points logged-in users straight to their workspace; anonymous
  // visitors land on the marketing home as before.
  const logoHref = isAuthed ? '/notes' : '/';

  return (
    <>
      <Link
        href={logoHref}
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
        {/* Pricing is the upsell — Pro users don't need to see it. */}
        {!isPro && (
          <Link
            href="/pricing"
            className="rounded-lg px-2 sm:px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            {t('pricing')}
          </Link>
        )}
      </nav>
    </>
  );
}
