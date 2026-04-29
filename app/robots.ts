import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://pokerreads.app';

  // Wildcards cover the locale prefix (/en/..., /es/...) so a single rule
  // disallows the path in every locale. Plain '/settings/' would not match
  // '/en/settings/' because robots.txt patterns anchor at the root.
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/*/admin',
        '/*/settings/',
        '/*/session/',
        '/*/sessions',
        '/*/notes',
        '/*/forgot-password',
        '/*/reset-password',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
