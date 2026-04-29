import { eq } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseAiResponse,
  rateLimitKey,
  RATE_LIMITS,
} from '@/lib/ai/noteStructurer';
import { getAuth } from '@/lib/auth';
import { getDb, type AppDB } from '@/lib/db';
import { aiUsage, users } from '@/lib/db/schema';
import { logger } from '@/lib/logger';

const ROUTE = 'ai.structure-note';
const ENDPOINT = 'structure-note';

const RequestSchema = z.object({
  note: z.string().min(1).max(2000),
  existingTags: z.array(z.string()).optional().default([]),
  locale: z.enum(['en', 'es']).optional().default('en'),
});

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct' as const;
const MAX_RETRIES = 2;

type Tier = 'anonymous' | 'free' | 'pro';

interface Caller {
  tier: Tier;
  userId?: string;
  ipHash: string;
}

export async function POST(request: Request) {
  // 1. Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const { note, existingTags, locale } = parsed.data;

  // 2. Resolve Cloudflare bindings + DB
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  // Dev fallback: Workers AI is not available in `next dev`.
  // We still log a "dev" usage row so QA can see things flowing.
  if (!env.AI) {
    const ipHash = await hashIp(getIp(request));
    await logUsage(db, {
      userId: undefined,
      ipHash,
      success: true,
      errorMessage: 'dev_mock',
    }).catch(() => undefined);
    return Response.json(devMockResponse(note, locale), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 3. Identify the caller (logged-in user with tier, or anonymous).
  const caller = await resolveCaller(request, db, env);

  // 4. Rate limit by caller identity (user-id-keyed when logged in, IP-hash
  //    otherwise) using KV. Anonymous: 10/day. Free: 20/day. Pro: 200/day.
  const limit = RATE_LIMITS[caller.tier];
  const counterKey = buildCounterKey(caller);

  const currentCount = env.RATE_LIMITS
    ? parseInt((await env.RATE_LIMITS.get(counterKey)) ?? '0', 10)
    : 0;

  if (currentCount >= limit) {
    await logUsage(db, {
      userId: caller.userId,
      ipHash: caller.ipHash,
      success: false,
      errorMessage: 'rate_limit_exceeded',
    }).catch((err) => {
      logger.error('ai_usage insert failed (rate limit path)', { route: ROUTE }, err);
    });
    return Response.json(
      { error: 'rate_limit_exceeded', limit },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(midnightUtcSeconds()),
        },
      }
    );
  }

  // 5. Build prompts
  const systemPrompt = buildSystemPrompt(locale);
  const userPrompt = buildUserPrompt(note, existingTags);

  // 6. Call Workers AI with retry on parse failure
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const aiResponse = await env.AI.run(AI_MODEL, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const rawText =
        typeof aiResponse === 'object' && aiResponse !== null && 'response' in aiResponse
          ? String((aiResponse as { response: unknown }).response)
          : String(aiResponse);

      const structured = parseAiResponse(rawText);

      // 7. Increment rate limit counter (TTL 25h covers timezone edge cases)
      if (env.RATE_LIMITS) {
        await env.RATE_LIMITS.put(counterKey, String(currentCount + 1), {
          expirationTtl: 90000,
        });
      }

      await logUsage(db, {
        userId: caller.userId,
        ipHash: caller.ipHash,
        success: true,
      }).catch((err) => {
        logger.error('ai_usage insert failed (success path)', { route: ROUTE }, err);
      });

      return Response.json(structured, {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': String(Math.max(0, limit - currentCount - 1)),
        },
      });
    } catch (err) {
      lastError = err;
    }
  }

  logger.error('AI structuring failed after retries', { route: ROUTE, locale }, lastError);
  await logUsage(db, {
    userId: caller.userId,
    ipHash: caller.ipHash,
    success: false,
    errorMessage:
      lastError instanceof Error ? lastError.message.slice(0, 500) : 'ai_processing_failed',
  }).catch((err) => {
    logger.error('ai_usage insert failed (error path)', { route: ROUTE }, err);
  });
  return Response.json({ error: 'ai_processing_failed' }, { status: 502 });
}

// ─── Caller resolution ────────────────────────────────────────────────────────

async function resolveCaller(
  request: Request,
  db: AppDB,
  env: { RATE_LIMITS?: KVNamespace }
): Promise<Caller> {
  const ipHash = await hashIp(getIp(request));

  try {
    const auth = getAuth(db, env);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) return { tier: 'anonymous', ipHash };

    const row = await db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    const tier: Tier = row?.tier === 'pro' ? 'pro' : 'free';
    return { tier, userId: session.user.id, ipHash };
  } catch (err) {
    // If session resolution fails (transient DB error, KV hiccup), fall back to
    // anonymous — stricter rate limit, never lets a logged-in user accidentally
    // get a higher limit they don't deserve.
    logger.error('AI route: session resolution failed', { route: ROUTE }, err);
    return { tier: 'anonymous', ipHash };
  }
}

function buildCounterKey(caller: Caller): string {
  if (caller.userId) return rateLimitKey(`user:${caller.userId}`);
  return rateLimitKey(`anon:${caller.ipHash}`);
}

// ─── Usage logging ────────────────────────────────────────────────────────────

interface UsageRecord {
  userId?: string;
  ipHash?: string;
  success: boolean;
  errorMessage?: string;
}

async function logUsage(db: AppDB, record: UsageRecord): Promise<void> {
  await db.insert(aiUsage).values({
    id: globalThis.crypto.randomUUID(),
    userId: record.userId ?? null,
    ipHash: record.ipHash ?? null,
    endpoint: ENDPOINT,
    tokensUsed: null,
    success: record.success,
    errorMessage: record.errorMessage ?? null,
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  );
}

async function hashIp(ip: string): Promise<string> {
  const data = new globalThis.TextEncoder().encode(ip);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function midnightUtcSeconds(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return Math.floor(tomorrow.getTime() / 1000);
}

function devMockResponse(note: string, locale: 'en' | 'es') {
  const isEs = locale === 'es';
  return {
    suggestedTags: ['fish', 'calling-station'],
    structuredSummary: isEs
      ? `[DEV] Jugador pasivo que tiende a pagar demasiado. Nota: "${note.slice(0, 60)}"`
      : `[DEV] Passive player who calls too wide. Note: "${note.slice(0, 60)}"`,
    preflopTendency: isEs ? 'Paga raises con manos débiles.' : 'Calls raises with weak hands.',
    postflopTendency: isEs ? 'Check-call en la mayoría de calles.' : 'Check-calls most streets.',
    confidence: 0.9,
  };
}
