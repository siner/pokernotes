import { eq } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import { buildSystemPrompt, buildUserPrompt, parseAiResponse } from '@/lib/ai/handStructurer';
import { rateLimitKey } from '@/lib/ai/noteStructurer';
import { getAuth } from '@/lib/auth';
import { getDb, type AppDB } from '@/lib/db';
import { aiUsage, users } from '@/lib/db/schema';
import { logger } from '@/lib/logger';

const ROUTE = 'ai.structure-hand';
const ENDPOINT = 'structure-hand';

const RequestSchema = z.object({
  description: z.string().min(20).max(4000),
  playerNickname: z.string().max(80).optional(),
  locale: z.enum(['en', 'es']).optional().default('en'),
  /**
   * Optional user hint for re-runs. When present, it is appended to the user
   * prompt as an explicit correction/clarification and temperature is bumped
   * so the model actually re-derives the structure rather than echoing the
   * previous deterministic output.
   */
  hint: z.string().max(800).optional(),
});

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct' as const;
const MAX_RETRIES = 2;

// Hand structuring is a Pro-only feature. Free/anonymous tiers are rejected at
// the gate; the rate limit only applies to Pro callers. Conservative initial
// limit — prompts are larger than note structuring (~3x token count).
const PRO_DAILY_LIMIT = 50;

interface Caller {
  userId: string;
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

  const { description, playerNickname, locale, hint } = parsed.data;

  // 2. Resolve Cloudflare bindings + DB
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);

  // 3. Gate: Pro-only. Resolve caller; reject anonymous/free up front.
  const ipHash = await hashIp(getIp(request));
  const gateResult = await resolveProCaller(request, db, env, ipHash);
  if (gateResult.kind === 'reject') {
    await logUsage(db, {
      userId: gateResult.userId,
      ipHash,
      success: false,
      errorMessage: gateResult.reason,
    }).catch((err) => {
      logger.error('ai_usage insert failed (gate path)', { route: ROUTE }, err);
    });
    return Response.json({ error: gateResult.reason }, { status: gateResult.status });
  }
  const caller = gateResult.caller;

  // Dev fallback: Workers AI is not bound in `next dev`. Return a mock so the
  // UI can be exercised without a deploy. Logged as `dev_mock` for clarity.
  if (!env.AI) {
    await logUsage(db, {
      userId: caller.userId,
      ipHash,
      success: true,
      errorMessage: 'dev_mock',
    }).catch(() => undefined);
    return Response.json(devMockResponse(description, locale), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 4. Rate limit (Pro only).
  const counterKey = rateLimitKey(`hand:user:${caller.userId}`);
  const currentCount = env.RATE_LIMITS
    ? parseInt((await env.RATE_LIMITS.get(counterKey)) ?? '0', 10)
    : 0;

  if (currentCount >= PRO_DAILY_LIMIT) {
    await logUsage(db, {
      userId: caller.userId,
      ipHash,
      success: false,
      errorMessage: 'rate_limit_exceeded',
    }).catch((err) => {
      logger.error('ai_usage insert failed (rate limit path)', { route: ROUTE }, err);
    });
    return Response.json(
      { error: 'rate_limit_exceeded', limit: PRO_DAILY_LIMIT },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(PRO_DAILY_LIMIT),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(midnightUtcSeconds()),
        },
      }
    );
  }

  // 5. Build prompts
  const systemPrompt = buildSystemPrompt(locale);
  const trimmedHint = hint?.trim() || undefined;
  const userPrompt = buildUserPrompt(description, {
    playerNickname,
    hint: trimmedHint,
  });

  // With a hint we want the model to actually re-derive the structure rather
  // than echo its previous deterministic output, so we bump the temperature.
  const temperature = trimmedHint ? 0.5 : 0.2;

  // 6. Call Workers AI with retry on parse failure
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const aiResponse = await env.AI.run(AI_MODEL, {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature,
        max_tokens: 900,
      });

      const rawText =
        typeof aiResponse === 'object' && aiResponse !== null && 'response' in aiResponse
          ? String((aiResponse as { response: unknown }).response)
          : String(aiResponse);

      const structured = parseAiResponse(rawText);

      // 7. Increment rate limit counter
      if (env.RATE_LIMITS) {
        await env.RATE_LIMITS.put(counterKey, String(currentCount + 1), {
          expirationTtl: 90000,
        });
      }

      await logUsage(db, {
        userId: caller.userId,
        ipHash,
        success: true,
      }).catch((err) => {
        logger.error('ai_usage insert failed (success path)', { route: ROUTE }, err);
      });

      return Response.json(structured, {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': String(PRO_DAILY_LIMIT),
          'X-RateLimit-Remaining': String(Math.max(0, PRO_DAILY_LIMIT - currentCount - 1)),
        },
      });
    } catch (err) {
      lastError = err;
    }
  }

  logger.error('AI hand structuring failed after retries', { route: ROUTE, locale }, lastError);
  await logUsage(db, {
    userId: caller.userId,
    ipHash,
    success: false,
    errorMessage:
      lastError instanceof Error ? lastError.message.slice(0, 500) : 'ai_processing_failed',
  }).catch((err) => {
    logger.error('ai_usage insert failed (error path)', { route: ROUTE }, err);
  });
  return Response.json({ error: 'ai_processing_failed' }, { status: 502 });
}

// ─── Pro gate ─────────────────────────────────────────────────────────────────

type GateResult =
  | { kind: 'ok'; caller: Caller }
  | { kind: 'reject'; status: number; reason: string; userId?: string };

async function resolveProCaller(
  request: Request,
  db: AppDB,
  env: { RATE_LIMITS?: KVNamespace },
  ipHash: string
): Promise<GateResult> {
  try {
    const auth = getAuth(db, env);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user) {
      return { kind: 'reject', status: 401, reason: 'unauthenticated' };
    }

    const row = await db
      .select({ tier: users.tier })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get();

    if (row?.tier !== 'pro') {
      return {
        kind: 'reject',
        status: 403,
        reason: 'pro_only',
        userId: session.user.id,
      };
    }

    return { kind: 'ok', caller: { userId: session.user.id, ipHash } };
  } catch (err) {
    logger.error('hand AI route: session resolution failed', { route: ROUTE }, err);
    return { kind: 'reject', status: 500, reason: 'session_error' };
  }
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

function devMockResponse(description: string, locale: 'en' | 'es') {
  const isEs = locale === 'es';
  return {
    title: isEs ? '[DEV] Mano sin estructurar' : '[DEV] Unstructured hand',
    summary: isEs
      ? `[DEV] Mock de IA para desarrollo. Entrada: "${description.slice(0, 80)}"...`
      : `[DEV] AI mock for development. Input: "${description.slice(0, 80)}"...`,
    variant: 'nlhe' as const,
    format: 'cash' as const,
    stakes: '',
    heroPosition: 'CO',
    villainPosition: 'BB',
    heroHand: '',
    villainHand: '',
    board: '',
    preflopAction: '',
    flopAction: '',
    turnAction: '',
    riverAction: '',
    potSize: '',
    result: 'unknown' as const,
    heroResult: '',
    keyMoment: isEs ? 'Mock de desarrollo.' : 'Development mock.',
    tags: ['hero-call', 'srp'],
    confidence: 0.5,
  };
}
