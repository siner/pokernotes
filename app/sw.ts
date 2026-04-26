import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from 'serwist';
import { CacheFirst, ExpirationPlugin, NetworkOnly, Serwist } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Cache player photos aggressively. URLs include a `?v={timestamp}` cache
// buster, so updates produce a new key and never serve stale bytes.
const photoCache: RuntimeCaching = {
  matcher: ({ sameOrigin, url: { pathname } }) =>
    sameOrigin && /^\/api\/players\/[^/]+\/photo$/.test(pathname),
  handler: new CacheFirst({
    cacheName: 'player-photos',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        maxAgeFrom: 'last-used',
      }),
    ],
  }),
};

// Bypass the SW cache for all other /api/* requests. Serwist's defaultCache
// uses NetworkFirst with a 10s timeout for /api/*, which can serve stale
// responses on slow connections — bad for sync correctness.
const apiNetworkOnly: RuntimeCaching = {
  matcher: ({ sameOrigin, url: { pathname } }) => sameOrigin && pathname.startsWith('/api/'),
  handler: new NetworkOnly(),
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Order matters — first matching rule wins.
  runtimeCaching: [photoCache, apiNetworkOnly, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: '/en/~offline',
        matcher({ request }: { request: Request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();
