import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { NotesPageTabs } from '@/components/notes/NotesPageTabs';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'notes' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default function NotesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <NotesPageTabs />
    </main>
  );
}
