import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
import {
  buildSystemPrompt,
  buildUserPrompt,
  parseAiResponse,
  rateLimitKey,
  RATE_LIMITS,
} from '@/lib/ai/noteStructurer';

const RequestSchema = z.object({
  note: z.string().min(1).max(2000),
  existingTags: z.array(z.string()).optional().default([]),
  locale: z.enum(['en', 'es']).optional().default('en'),
});

const AI_MODEL = '@cf/meta/llama-3.1-8b-instruct' as const;
const MAX_RETRIES = 2;

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

  // 2. Get Cloudflare bindings
  const { env } = await getCloudflareContext({ async: true });

  // Dev fallback: Workers AI is not available in `next dev`
  if (!env.AI) {
    return Response.json(devMockResponse(note, locale), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  // 3. Rate limiting via KV (IP-based for anonymous users)
  const ip =
    request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown';
  const ipHash = await hashIp(ip);
  const kvKey = rateLimitKey(`anon:${ipHash}`);

  const currentCount = env.RATE_LIMITS
    ? parseInt((await env.RATE_LIMITS.get(kvKey)) ?? '0', 10)
    : 0;

  if (currentCount >= RATE_LIMITS.anonymous) {
    return Response.json({ error: 'rate_limit_exceeded' }, { status: 429 });
  }

  // 4. Build prompts
  const systemPrompt = buildSystemPrompt(locale);
  const userPrompt = buildUserPrompt(note, existingTags);

  // 5. Call Workers AI with retry on parse failure
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

      // Workers AI returns { response: string } for chat models
      const rawText =
        typeof aiResponse === 'object' && aiResponse !== null && 'response' in aiResponse
          ? String((aiResponse as { response: unknown }).response)
          : String(aiResponse);

      const structured = parseAiResponse(rawText);

      // 6. Increment rate limit counter (TTL = 25 hours to cover timezone edge cases)
      if (env.RATE_LIMITS) {
        await env.RATE_LIMITS.put(kvKey, String(currentCount + 1), { expirationTtl: 90000 });
      }

      return Response.json(structured, {
        headers: {
          'Cache-Control': 'no-store',
          'X-RateLimit-Limit': String(RATE_LIMITS.anonymous),
          'X-RateLimit-Remaining': String(RATE_LIMITS.anonymous - currentCount - 1),
        },
      });
    } catch (err) {
      lastError = err;
    }
  }

  console.error('AI structure-note failed after retries', lastError);
  return Response.json({ error: 'ai_processing_failed' }, { status: 502 });
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

async function hashIp(ip: string): Promise<string> {
  const data = new globalThis.TextEncoder().encode(ip);
  const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
