import { z } from 'zod';

// ─── Tag vocabulary ───────────────────────────────────────────────────────────
//
// Controlled vocabulary for hand-level tags. English keys, never translated —
// they are stable identifiers used for filtering and search. Loose enough to
// describe most live-poker spots without forcing a rigid taxonomy.

export const HAND_TAGS = [
  // action types
  'bluff',
  'semi-bluff',
  'value-bet',
  'thin-value',
  'slowplay',
  'overbet',
  'check-raise',
  'donk-bet',
  '3bet',
  '4bet',
  'squeeze',
  'cold-call',
  'iso-raise',
  'limp',
  // hero perspective
  'hero-call',
  'hero-fold',
  'hero-shove',
  'hero-bluff',
  'hero-trap',
  // hand archetypes
  'cooler',
  'setup',
  'bad-beat',
  'suckout',
  // table dynamics
  'multiway',
  'heads-up',
  'srp',
  '3bp',
  '4bp',
  // board textures
  'wet-board',
  'dry-board',
  'paired-board',
  'monotone',
  'two-tone',
  'straighty',
  // villain perspective
  'villain-bluff',
  'villain-value',
  'villain-station',
  'villain-spew',
] as const;

const handTagsSet = new Set<string>(HAND_TAGS);

// ─── Enums ────────────────────────────────────────────────────────────────────

const VARIANTS = ['nlhe', 'plo', 'plo5', 'other'] as const;
const FORMATS = ['cash', 'tournament', 'unknown'] as const;
const RESULTS = ['hero_won', 'hero_lost', 'split', 'no_showdown', 'unknown'] as const;

// ─── Response schema ──────────────────────────────────────────────────────────
//
// Loose by design: every field except `title` and `summary` is optional. Live
// players rarely remember every detail; we want to capture what the user said
// without forcing the AI to invent missing fields.

export const AiHandResponseSchema = z.object({
  title: z.string().min(1).max(140),
  summary: z.string().min(1).max(800),

  variant: z.enum(VARIANTS).catch('nlhe').default('nlhe'),
  format: z.enum(FORMATS).catch('unknown').default('unknown'),
  stakes: z.string().max(60).optional().default(''),

  heroPosition: z.string().max(20).optional().default(''),
  villainPosition: z.string().max(20).optional().default(''),

  heroHand: z.string().max(20).optional().default(''),
  villainHand: z.string().max(20).optional().default(''),

  board: z.string().max(40).optional().default(''),

  preflopAction: z.string().max(500).optional().default(''),
  flopAction: z.string().max(500).optional().default(''),
  turnAction: z.string().max(500).optional().default(''),
  riverAction: z.string().max(500).optional().default(''),

  potSize: z.string().max(40).optional().default(''),
  result: z.enum(RESULTS).catch('unknown').default('unknown'),
  heroResult: z.string().max(40).optional().default(''),

  keyMoment: z.string().max(400).optional().default(''),

  tags: z
    .array(z.string())
    .optional()
    .default([])
    .transform((tags) => tags.filter((t) => handTagsSet.has(t))),

  confidence: z.number().min(0).max(1).optional().default(0.7),
});

export type AiHandResponse = z.infer<typeof AiHandResponseSchema>;

// ─── Prompt builder ───────────────────────────────────────────────────────────

const APPROVED_TAGS = HAND_TAGS.join(', ');

interface OneShot {
  langName: string;
  langDirective: string;
  example: { user: string; assistant: string };
}

const NARRATIVE_FIELDS =
  'title, summary, keyMoment, preflopAction, flopAction, turnAction, riverAction, heroResult';

const ONE_SHOTS: Record<'en' | 'es', OneShot> = {
  en: {
    langName: 'English',
    langDirective: `OUTPUT LANGUAGE: ENGLISH. The narrative fields (${NARRATIVE_FIELDS}) MUST be written in English, regardless of the language of the input description.`,
    example: {
      // Input is in Spanish on purpose: forces the model to switch languages
      // and prevents it from echoing the input language as a shortcut.
      user: 'Structure this poker hand and return JSON:\n\n"Cash 1/3, abrí desde CO con AKo a 12, BB pagó. Flop AK7 con dos diamantes, donkeó 25, subí a 75, pagó. Turn 4d, completaba color. Check, aposté 150 a un bote de 200, hizo check-raise all-in por 400 más. Foldeé. Perdí unos 200."',
      assistant: JSON.stringify({
        title: 'AKo top-two on AK7 two-tone, fold to turn check-raise',
        summary:
          'Hero opens AKo from CO and gets called by BB. Flop AK7 with two diamonds: villain donks small, hero raises and gets called. Turn brings the flush card; villain check-raises all-in over hero’s bet, hero folds top two.',
        variant: 'nlhe',
        format: 'cash',
        stakes: '1/3',
        heroPosition: 'CO',
        villainPosition: 'BB',
        heroHand: 'AKo',
        villainHand: '',
        board: 'AK7dd 4d',
        preflopAction: 'Hero opens CO to 12. BB calls.',
        flopAction: 'BB donks 25, hero raises to 75, BB calls.',
        turnAction:
          'BB checks, hero bets 150 into ~200, BB check-raises all-in for 400 more, hero folds.',
        riverAction: '',
        potSize: '~600',
        result: 'no_showdown',
        heroResult: '-200',
        keyMoment:
          'Tough turn check-raise on the flush-completing card with top two and no redraw.',
        tags: ['hero-fold', 'check-raise', 'wet-board', 'srp'],
        confidence: 0.85,
      }),
    },
  },
  es: {
    langName: 'Spanish',
    langDirective: `IDIOMA DE SALIDA: ESPAÑOL. Los campos narrativos (${NARRATIVE_FIELDS}) DEBEN escribirse en español, independientemente del idioma de la descripción de entrada. Nunca mezcles inglés y español en el mismo campo. Las claves del JSON y los tags se mantienen en inglés.`,
    example: {
      // Input in English on purpose to force a language switch in the output.
      user: 'Structure this poker hand and return JSON:\n\n"Cash 1/3 NL, opened to 12 from CO with AKo, BB called. Flop AK7 two diamonds, he donked 25, I raised to 75, he called. Turn 4d, completed the flush. He checked, I bet 150 into 200, he check-shoved 400 more. I folded. Lost about 200."',
      assistant: JSON.stringify({
        title: 'AKo doble pareja en AK7 dos diamantes, fold a check-raise turn',
        summary:
          'Hero abre AKo desde CO y BB paga. Flop AK7 con dos diamantes: villano hace donk pequeño, hero sube y le pagan. El turn 4d completa color; villano hace check-raise all-in y hero foldea doble pareja sin redraw.',
        variant: 'nlhe',
        format: 'cash',
        stakes: '1/3',
        heroPosition: 'CO',
        villainPosition: 'BB',
        heroHand: 'AKo',
        villainHand: '',
        board: 'AK7dd 4d',
        preflopAction: 'Hero abre desde CO a 12. BB paga.',
        flopAction: 'BB donk 25, hero sube a 75, BB paga.',
        turnAction:
          'BB check, hero apuesta 150 a un bote de ~200, BB hace check-raise all-in por 400 más, hero foldea.',
        riverAction: '',
        potSize: '~600',
        result: 'no_showdown',
        heroResult: '-200',
        keyMoment:
          'Check-raise complicado en el turn que completa color con doble pareja sin re-draw.',
        tags: ['hero-fold', 'check-raise', 'wet-board', 'srp'],
        confidence: 0.85,
      }),
    },
  },
};

export function buildSystemPrompt(locale: 'en' | 'es' = 'en'): string {
  const shot = ONE_SHOTS[locale];
  return `You are a poker hand structuring assistant. The user describes a poker hand they played, often informally and with omissions. Extract the hand into structured JSON.

${shot.langDirective}

CARD NOTATION:
- Ranks: 2-9, T (ten), J, Q, K, A. Suits: h (hearts), s (spades), d (diamonds), c (clubs).
- Hero/villain hand: when suits are known, concatenate (e.g. "AhKs"). When only ranks/suitedness is known, use shorthand "AKs" or "AKo". If unknown, return "".
- Board: write the flop as 3 chars + suit-coding, then a space, then turn, space, river. Examples: "AhKs7d 4c 2d", "AK7dd 4d" (suit-coding "dd" means two diamonds when exact suits unclear).

POSITIONS (NLHE 6/9-max): UTG, UTG+1, MP, HJ, CO, BTN, SB, BB. Infer if not stated, leave empty if truly unknown.

ENUMS:
- variant: "nlhe" | "plo" | "plo5" | "other" (default "nlhe").
- format: "cash" | "tournament" | "unknown".
- result: "hero_won" | "hero_lost" | "split" | "no_showdown" | "unknown".

RULES:
- Return ONLY valid JSON. No markdown fences, no commentary, no preamble.
- Be faithful: do NOT invent details the user did not state. Empty string is better than a guess.
- title: short headline, max 100 chars, names the spot ("KK in 4bp pot, snap-call river").
- summary: 1-3 sentences narrating the hand chronologically.
- keyMoment: the single decision/turning point that makes this hand worth saving.
- Only emit tags from the approved list. Never invent tags. Skip tags rather than guess.

Approved tags (English keys only): ${APPROVED_TAGS}

Required JSON shape (exact keys):
{
  "title": string,
  "summary": string,
  "variant": "nlhe" | "plo" | "plo5" | "other",
  "format": "cash" | "tournament" | "unknown",
  "stakes": string,
  "heroPosition": string,
  "villainPosition": string,
  "heroHand": string,
  "villainHand": string,
  "board": string,
  "preflopAction": string,
  "flopAction": string,
  "turnAction": string,
  "riverAction": string,
  "potSize": string,
  "result": "hero_won" | "hero_lost" | "split" | "no_showdown" | "unknown",
  "heroResult": string,
  "keyMoment": string,
  "tags": string[],
  "confidence": number
}

Example of the expected output language (${shot.langName}):

USER:
${shot.example.user}

ASSISTANT:
${shot.example.assistant}

Reminder: ${shot.langDirective}`;
}

export function buildUserPrompt(
  rawDescription: string,
  context?: { playerNickname?: string }
): string {
  const contextHint = context?.playerNickname
    ? `\nThe primary opponent (villain) in this hand is referred to as "${context.playerNickname}".`
    : '';
  return `Structure this poker hand and return JSON:${contextHint}\n\n"${rawDescription}"`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

function extractJson(raw: string): string {
  const match = raw.match(/\{[\s\S]*\}/);
  return match ? match[0] : raw;
}

export function parseAiResponse(raw: string): AiHandResponse {
  const extracted = extractJson(raw.trim());
  const parsed: unknown = JSON.parse(extracted);
  return AiHandResponseSchema.parse(parsed);
}
