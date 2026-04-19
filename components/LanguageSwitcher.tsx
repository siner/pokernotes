'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

type Locale = (typeof routing.locales)[number];

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'EN',
  es: 'ES',
};

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(nextLocale: Locale) {
    router.replace(pathname, { locale: nextLocale });
  }

  return (
    <div className="flex items-center gap-1" role="navigation" aria-label={t('switchLanguage')}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleChange(loc as Locale)}
          aria-pressed={locale === loc}
          aria-label={`Switch to ${LOCALE_LABELS[loc as Locale]}`}
          className={[
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            'min-h-[36px] min-w-[36px] sm:min-h-0 sm:min-w-0',
            locale === loc
              ? 'bg-emerald-500 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-100',
          ].join(' ')}
        >
          {LOCALE_LABELS[loc as Locale]}
        </button>
      ))}
    </div>
  );
}
