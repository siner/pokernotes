'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const TOOLS = [
  { key: 'potOdds', href: '/tools/pot-odds' },
  { key: 'pushFold', href: '/tools/push-fold' },
  { key: 'icm', href: '/tools/icm' },
  { key: 'handRankings', href: '/tools/hand-rankings' },
] as const;

export function ToolsNav() {
  const t = useTranslations('tools.nav');
  const pathname = usePathname();

  return (
    <nav
      aria-label="Calculator navigation"
      className="flex gap-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/50 p-1 scrollbar-none"
    >
      {TOOLS.map(({ key, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={key}
            href={href}
            className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            {t(key)}
          </Link>
        );
      })}
    </nav>
  );
}
