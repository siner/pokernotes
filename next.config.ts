import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Cloudflare Pages via OpenNext requires this output
  // (OpenNext overrides it during build:cf, but local dev uses default)
  experimental: {
    // Server actions are enabled by default in Next.js 15
  },
};

export default withNextIntl(nextConfig);
