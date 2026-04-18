import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | PokerNotes',
    default: 'PokerNotes — Live Poker Player Notes & Calculators',
  },
  description:
    'AI-powered notes for live poker players. Free calculators: pot odds, ICM, push/fold. Mobile-first PWA.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
