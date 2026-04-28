import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Spade } from 'lucide-react';

export async function Footer() {
  const t = await getTranslations('footer');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-slate-800 bg-slate-900/50 pt-16 pb-8">
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2 font-bold text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                <Spade className="h-5 w-5 fill-current" />
              </span>
              PokerReads
            </Link>
            <p className="text-sm text-slate-400">{t('tagline')}</p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-200">{t('sectionTools')}</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/tools/pot-odds" className="transition-colors hover:text-emerald-400">
                  Pot Odds Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/push-fold" className="transition-colors hover:text-emerald-400">
                  Push/Fold Nash Chart
                </Link>
              </li>
              <li>
                <Link href="/tools/icm" className="transition-colors hover:text-emerald-400">
                  ICM Calculator
                </Link>
              </li>
              <li>
                <Link href="/tools/break-even" className="transition-colors hover:text-emerald-400">
                  Break-Even Calculator
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-200">{t('sectionProduct')}</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/notes" className="transition-colors hover:text-emerald-400">
                  {t('myNotes')}
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="transition-colors hover:text-emerald-400">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-slate-200">{t('sectionLegal')}</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li>
                <Link href="/terms" className="transition-colors hover:text-emerald-400">
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="transition-colors hover:text-emerald-400">
                  {t('privacy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 border-t border-slate-800 pt-8 text-center text-sm text-slate-400">
          {t('copyright', { year: currentYear })}
        </div>
      </div>
    </footer>
  );
}
