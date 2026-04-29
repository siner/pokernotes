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

interface OneShot {
  langName: string;
  langDirective: string;
  example: { user: string; assistant: string };
}

const ONE_SHOTS: Record<'en' | 'es', OneShot> = {
  en: {
    langName: 'English',
    langDirective:
      'OUTPUT LANGUAGE: ENGLISH. The fields structuredSummary, preflopTendency and postflopTendency MUST be written in English, regardless of the language of the input note.',
    example: {
      user: 'Analyze this poker note and return JSON:\n\n"Pagó mi all-in en el river con pareja media. Nunca foldea a 3bets."',
      assistant: JSON.stringify({
        suggestedTags: ['calling-station', 'sticky'],
        structuredSummary:
          'Loose-passive caller who pays off thin value bets and refuses to fold to aggression.',
        preflopTendency: 'Calls 3bets too wide; rarely folds preflop.',
        postflopTendency: 'Calls down with marginal pairs even on scary rivers.',
        confidence: 0.9,
      }),
    },
  },
  es: {
    langName: 'Spanish',
    langDirective:
      'IDIOMA DE SALIDA: ESPAÑOL. Los campos structuredSummary, preflopTendency y postflopTendency DEBEN escribirse en español, independientemente del idioma de la nota de entrada. Nunca mezcles inglés y español en el mismo campo.',
    example: {
      user: 'Analyze this poker note and return JSON:\n\n"Called my river shove with second pair. Never folds to 3bets."',
      assistant: JSON.stringify({
        suggestedTags: ['calling-station', 'sticky'],
        structuredSummary: 'Pagador pasivo: paga apuestas finas y nunca foldea ante presión.',
        preflopTendency: 'Paga 3bets con manos demasiado amplias; rara vez foldea preflop.',
        postflopTendency: 'Va hasta el river con pares mediocres incluso en boards peligrosos.',
        confidence: 0.9,
      }),
    },
  },
};

export function buildSystemPrompt(locale: 'en' | 'es' = 'en'): string {
  const shot = ONE_SHOTS[locale];
  return `You are a poker player profiling assistant. Analyze raw notes about a poker player's behavior and return structured JSON.

${shot.langDirective}

Rules:
- Return ONLY valid JSON, no markdown fences, no explanation text
- Only use tags from the approved list (English keys, never translate them)
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
}

Example of the expected output language (${shot.langName}):

USER:
${shot.example.user}

ASSISTANT:
${shot.example.assistant}

Reminder: ${shot.langDirective}`;
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
