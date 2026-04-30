'use client';

import { useEffect, useState } from 'react';
import { Users, PlayCircle, Calculator, Settings as SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useSession } from '@/lib/auth/client';
import { getActiveSessionId } from '@/lib/storage';

interface NavEntry {
  href: string;
  /** Path prefix used to mark the entry as active */
  match: string;
  labelKey: 'notes' | 'session' | 'tools' | 'settings';
  Icon: typeof Users;
  /** Show a small status dot in the corner (e.g. active session indicator) */
  hasIndicator?: boolean;
}

export function BottomNav() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const t = useTranslations('mobileNav');
  const [hasActiveSession, setHasActiveSession] = useState(false);

  // The active session id lives in localStorage. Recheck on path change so the
  // dot disappears immediately when the user ends a session and navigates away.
  useEffect(() => {
    setHasActiveSession(!!getActiveSessionId());
  }, [pathname]);

  // Render nothing until we know the auth state, and never render for guests —
  // the bottom bar is a logged-in-only affordance and would just steal viewport
  // space on the public landing page otherwise.
  if (isPending || !session?.user) return null;

  const entries: NavEntry[] = [
    { href: '/notes', match: '/notes', labelKey: 'notes', Icon: Users },
    {
      href: '/session',
      match: '/session',
      labelKey: 'session',
      Icon: PlayCircle,
      hasIndicator: hasActiveSession,
    },
    { href: '/tools/pot-odds', match: '/tools', labelKey: 'tools', Icon: Calculator },
    { href: '/settings', match: '/settings', labelKey: 'settings', Icon: SettingsIcon },
  ];

  return (
    <nav
      aria-label={t('label')}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[64px] items-stretch border-t border-white/5 bg-[#060d08]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      {entries.map(({ href, match, labelKey, Icon, hasIndicator }) => {
        const active = pathname === match || pathname.startsWith(`${match}/`);
        return (
          <Link
            key={href}
            href={href}
            className={
              'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ' +
              (active ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300')
            }
            aria-current={active ? 'page' : undefined}
          >
            <span className="relative">
              <Icon size={20} aria-hidden="true" />
              {hasIndicator && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-2.5 w-2.5 items-center justify-center"
                >
                  <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
