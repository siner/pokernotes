/**
 * Cloudflare Workers bindings available in the request context.
 * These are injected by OpenNext at runtime — not available in `process.env`.
 *
 * Access via: import { getCloudflareContext } from '@opennextjs/cloudflare'
 */
interface CloudflareEnv {
  /** Cloudflare D1 — primary database */
  DB: D1Database;
  /** Cloudflare R2 — player photo storage (Pro only) */
  PLAYER_PHOTOS: R2Bucket;
  /** Cloudflare KV — rate limiting + session cache */
  RATE_LIMITS: KVNamespace;
  /** Cloudflare Workers AI — Llama 3.1 8B */
  AI: Ai;
  /** Stripe API Secret Key */
  STRIPE_SECRET_KEY: string;
  /** Stripe Webhook Secret */
  STRIPE_WEBHOOK_SECRET: string;
  /** Stripe Pro Price ID */
  NEXT_PUBLIC_STRIPE_PRO_PRICE_ID: string;
  /** Public App URL */
  NEXT_PUBLIC_APP_URL: string;
}
