import { z } from 'zod';
import { ALL_TAGS } from '@/lib/constants/tags';

// ─── Response schema ─────────────────────────────────────────────────────────

const allTagsSet = new Set<string>(ALL_TAGS);

export const AiNoteResponseSchema = z.object({
  suggestedTags: z
    .array(z.string())
    .transform((tags: string[]) => tags.filter((t: string) => allTagsSet.has(t))),
  structuredSummary: z.string().min(1),
  preflopTendency: z.string().optional().default(''),
  postflopTendency: z.string().optional().default(''),
  confidence: z.number().optional().default(0.8),
});

export type AiNoteResponse = z.infer<typeof AiNoteResponseSchema>;

// ─── Prompt builder ───────────────────────────────────────────────────────────

const APPROVED_TAGS = ALL_TAGS.join(', ');

export function buildSystemPrompt(locale: 'en' | 'es' = 'en'): string {
  const lang = locale === 'es' ? 'Spanish' : 'English';
  return `You are a poker player profiling assistant. Analyze raw notes about a poker player's behavior and return structured JSON.

Rules:
- Return ONLY valid JSON, no markdown fences, no explanation text
- Write structuredSummary and tendencies in ${lang}
- Only use tags from the approved list
- Keep summaries concise (1-2 sentences max)
- If a tendency is unclear, return an empty string

Approved tags: ${APPROVED_TAGS}

Required JSON format (no deviations):
{
  "suggestedTags": string[],
  "structuredSummary": string,
  "preflopTendency": string,
  "postflopTendency": string,
  "confidence": number
}`;
}

export function buildUserPrompt(rawNote: string, existingTags: string[] = []): string {
  const tagHint =
    existingTags.length > 0
      ? `\nExisting tags on this player: ${existingTags.join(', ')} — confirm or extend these.`
      : '';
  return `Analyze this poker note and return JSON:${tagHint}\n\n"${rawNote}"`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  // Try to find a JSON object in the response — models sometimes add prose
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : raw;
}

export function parseAiResponse(raw: string): AiNoteResponse {
  const extracted = extractJson(raw.trim());
  const parsed: unknown = JSON.parse(extracted);
  return AiNoteResponseSchema.parse(parsed);
}

// ─── Rate limit helpers ───────────────────────────────────────────────────────

export const RATE_LIMITS = {
  anonymous: 10,
  free: 20,
  pro: 200,
} as const;

export function rateLimitKey(identifier: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `ai_rate:${identifier}:${date}`;
}
