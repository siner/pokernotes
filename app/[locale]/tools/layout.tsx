import { ReactNode } from 'react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowLeft } from 'lucide-react';
import { ToolsNav } from '@/components/ToolsNav';

export default async function ToolsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations('nav');

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToHome')}
        </Link>
      </div>
      <div className="mb-8">
        <ToolsNav />
      </div>
      {children}
    </div>
  );
}
