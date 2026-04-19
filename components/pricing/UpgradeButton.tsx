'use client';

import { useSession } from '@/lib/auth/client';
import { useRouter } from '@/i18n/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export function UpgradeButton({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!session?.user) {
      router.push('/login?callbackUrl=/pricing');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
        }),
      });

      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error starting checkout:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40 active:scale-95 disabled:opacity-70 disabled:active:scale-100"
    >
      {loading && <Loader2 className="h-5 w-5 animate-spin" />}
      {children}
    </button>
  );
}
