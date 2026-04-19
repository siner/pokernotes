import { Spade } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';
import { Suspense } from 'react';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'auth' });
  return { title: t('signIn') };
}

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-56px)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/30 text-white">
            <Spade className="h-6 w-6 fill-current" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-white">PokerNotes</h1>
            <p className="mt-1 text-sm text-slate-500">Pro</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
