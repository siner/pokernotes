'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MailCheck, Loader2 } from 'lucide-react';
import { sendVerificationEmail, useSession } from '@/lib/auth/client';

type Status = 'idle' | 'sending' | 'sent' | 'error';

export function VerifyEmailBanner() {
  const t = useTranslations('auth.verifyEmail');
  const { data: session } = useSession();
  const [status, setStatus] = useState<Status>('idle');

  const user = session?.user;
  if (!user || user.emailVerified) return null;

  async function handleResend() {
    if (!user?.email) return;
    setStatus('sending');
    try {
      const result = await sendVerificationEmail({
        email: user.email,
        callbackURL: '/settings',
      });
      if (result.error) {
        setStatus('error');
        return;
      }
      setStatus('sent');
      window.setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
      <div className="flex items-start gap-3">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-amber-300">{t('bannerTitle')}</p>
          <p className="mt-1 text-sm text-amber-200/80">{t('bannerBody', { email: user.email })}</p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={handleResend}
              disabled={status === 'sending'}
              className="inline-flex min-h-[36px] items-center gap-2 rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 hover:bg-amber-500/30 disabled:opacity-60"
            >
              {status === 'sending' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {status === 'sending' ? t('resending') : t('resend')}
            </button>
            {status === 'sent' && (
              <span className="text-sm text-emerald-300" role="status">
                {t('resent')}
              </span>
            )}
            {status === 'error' && (
              <span className="text-sm text-red-300" role="alert">
                {t('resendError')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
