/**
 * Returns the input only if it's a same-origin relative path. Anything else
 * (absolute URLs, protocol-relative `//evil.com`, unknown schemes, missing
 * leading slash) falls back to the provided default.
 *
 * Use to sanitize callbackUrl-style values before passing them to a router or
 * to OAuth redirect parameters — guards against open-redirect phishing.
 */
export function safeInternalPath(raw: string | null | undefined, fallback: string): string {
  if (!raw) return fallback;
  if (!raw.startsWith('/')) return fallback;
  if (raw.startsWith('//')) return fallback; // protocol-relative
  if (raw.startsWith('/\\')) return fallback; // some browsers normalize \\ to //
  return raw;
}
