import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokerreads.app';
  const locales = ['en', 'es'];
  const routes = [
    '',
    '/pricing',
    '/tools/pot-odds',
    '/tools/push-fold',
    '/tools/icm',
    '/tools/break-even',
    '/privacy',
    '/terms',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      const isLegal = route === '/privacy' || route === '/terms';
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : isLegal ? 'yearly' : 'weekly',
        priority: route === '' ? 1 : isLegal ? 0.3 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
