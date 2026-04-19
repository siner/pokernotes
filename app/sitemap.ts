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
    '/tools/hand-rankings',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' ? 'daily' : 'weekly',
        priority: route === '' ? 1 : 0.8,
      });
    }
  }

  return sitemapEntries;
}
