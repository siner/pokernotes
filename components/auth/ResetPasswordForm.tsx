'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth/client';

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordForm() {
  const t = useTranslations('auth.resetPassword');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {t('missingToken')}
        </p>
        <Link
          href="/forgot-password"
          className="inline-block text-sm text-emerald-400 hover:text-emerald-300"
        >
          {t('requestNew')}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t('passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('passwordMismatch'));
      return;
    }

    setLoading(true);
    const result = await authClient.resetPassword({ newPassword: password, token: token! });

    if (result.error) {
      const code = result.error.code;
      if (code === 'INVALID_TOKEN' || code === 'TOKEN_EXPIRED') {
        setError(t('invalidToken'));
      } else {
        setError(t('error'));
      }
      setLoading(false);
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 1500);
  }

  if (done) {
    return (
      <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-400">
        {t('success')}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-white">{t('title')}</h1>
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('newPassword')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          autoFocus
          minLength={MIN_PASSWORD_LENGTH}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/40 focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-slate-400">{t('confirmPassword')}</label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-emerald-500/40 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="flex min-h-[48px] items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50"
      >
        {loading ? t('resetting') : t('submit')}
      </button>
    </form>
  );
}
