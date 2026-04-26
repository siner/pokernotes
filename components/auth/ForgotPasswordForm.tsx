'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Spade } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth/client';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgotPassword');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const origin = window.location.origin;
    const redirectTo = `${origin}/reset-password`;
    const result = await authClient.requestPasswordReset({ email, redirectTo });

    if (result.error) {
      setError(t('error'));
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <div className="space-y-6 text-center">
        <Spade className="mx-auto h-10 w-10 fill-emerald-500 text-emerald-500" />
        <p className="text-sm text-slate-300">{t('success')}</p>
        <Link
          href="/login"
          className="inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          {t('backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
        <p className="text-sm text-slate-400">{t('description')}</p>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          autoFocus
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/40 focus:outline-none"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t('sending') : t('submit')}
      </button>

      <Link href="/login" className="text-center text-sm text-slate-500 hover:text-slate-300">
        {t('backToLogin')}
      </Link>
    </form>
  );
}
