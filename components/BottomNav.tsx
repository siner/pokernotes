'use client';

import { Users, PlayCircle, Calculator, Settings as SettingsIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { useSession } from '@/lib/auth/client';

interface NavEntry {
  href: string;
  /** Path prefix used to mark the entry as active */
  match: string;
  labelKey: 'notes' | 'session' | 'tools' | 'settings';
  Icon: typeof Users;
}

const ENTRIES: NavEntry[] = [
  { href: '/notes', match: '/notes', labelKey: 'notes', Icon: Users },
  { href: '/session', match: '/session', labelKey: 'session', Icon: PlayCircle },
  { href: '/tools/pot-odds', match: '/tools', labelKey: 'tools', Icon: Calculator },
  { href: '/settings', match: '/settings', labelKey: 'settings', Icon: SettingsIcon },
];

export function BottomNav() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const t = useTranslations('mobileNav');

  // Render nothing until we know the auth state, and never render for guests —
  // the bottom bar is a logged-in-only affordance and would just steal viewport
  // space on the public landing page otherwise.
  if (isPending || !session?.user) return null;

  return (
    <nav
      aria-label={t('label')}
      className="fixed inset-x-0 bottom-0 z-40 flex h-[64px] items-stretch border-t border-white/5 bg-[#060d08]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      {ENTRIES.map(({ href, match, labelKey, Icon }) => {
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
            <Icon size={20} aria-hidden="true" />
            <span className="text-[10px] font-medium leading-none">{t(labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}
