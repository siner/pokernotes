import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// Wires up wrangler's platform proxy so CF bindings work in `next dev` only
if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev();
}

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // Cloudflare Pages via OpenNext requires this output
  // (OpenNext overrides it during build:cf, but local dev uses default)
  experimental: {
    // Server actions are enabled by default in Next.js 15
  },
};

export default withSerwist(withNextIntl(nextConfig));
