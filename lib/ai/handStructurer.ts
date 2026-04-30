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

// ─── Normalizers ──────────────────────────────────────────────────────────────
//
// Belt-and-suspenders: even with a strict prompt rule, the model occasionally
// writes "cutoff" or "big blind" verbatim. Normalize at parse time so the
// stored shape is always canonical.

const POSITION_ALIASES: Record<string, string> = {
  'under the gun': 'UTG',
  utg: 'UTG',
  'utg+1': 'UTG+1',
  'utg+2': 'UTG+2',
  'middle position': 'MP',
  mp: 'MP',
  'mp+1': 'MP+1',
  lojack: 'LJ',
  lj: 'LJ',
  hijack: 'HJ',
  hj: 'HJ',
  cutoff: 'CO',
  co: 'CO',
  button: 'BTN',
  btn: 'BTN',
  'on the button': 'BTN',
  'small blind': 'SB',
  sb: 'SB',
  'big blind': 'BB',
  bb: 'BB',
};

function normalizePosition(raw: string): string {
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return '';
  const alias = POSITION_ALIASES[cleaned];
  if (alias) return alias;
  // If the model uppercased it already (e.g. "CO"), keep as-is.
  const upper = raw.trim().toUpperCase();
  if (Object.values(POSITION_ALIASES).includes(upper)) return upper;
  return raw.trim();
}

// "25BB", "80BB", "50 big blinds" are stack sizes, not stakes. Strip them.
const STACK_SIZE_RE = /^\d+(\.\d+)?\s*(bb|big\s*blinds?|blinds?)$/i;

function normalizeStakes(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (STACK_SIZE_RE.test(trimmed)) return '';
  return trimmed;
}

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
  stakes: z.string().max(60).optional().default('').transform(normalizeStakes),

  heroPosition: z.string().max(20).optional().default('').transform(normalizePosition),
  villainPosition: z.string().max(20).optional().default('').transform(normalizePosition),

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

═══════════════════════════════════════════════════════════════════════════════
CRITICAL RULE — FAITHFULNESS:
NEVER invent details the user did not state. If a field is not mentioned, return "" (or "unknown" for enum fields). Empty is ALWAYS better than a guess.

Examples of what NOT to do:
✗ Input says "torneo, 25BB efectivos, AKs vs TT, floppea set" → DO NOT set heroPosition to "UTG" (not mentioned), DO NOT set board to "set" (set is the hand type, not cards), DO NOT set variant to "plo" (no PLO signal).
✗ Input says "with kings vs aces, lost my stack" → DO NOT set tags to ["hero-fold"] (hero called/got it in, did not fold). Use ["cooler"] instead.
✗ Input says "bet 90, he calls" → DO NOT call this a "check-raise" tag (it is a bet+call, not a check-raise).
═══════════════════════════════════════════════════════════════════════════════

CARD NOTATION:
- Ranks: 2-9, T (ten), J, Q, K, A. Suits: h (hearts), s (spades), d (diamonds), c (clubs).
- Hero/villain hand:
  · Exact suits known → concatenate, e.g. "AhKs", "AsAd".
  · "X of [suit]" with both cards same suit (e.g. "76 of spades") → SUITED, write "76s".
  · "X off-suit" or different suits → "AKo".
  · Unknown → "".
- Board: flop as 3 chars + suits, then space, turn, space, river. Examples:
  · Exact suits: "AhKs7d 4c 2d"
  · Suits partially known: "AK7dd 4d" ("dd" = two diamonds among the flop)
  · No suit info: "AK7 4 2"

POSITIONS — STRICT TAXONOMY:
- Allowed values ONLY: UTG, UTG+1, UTG+2, MP, MP+1, LJ, HJ, CO, BTN, SB, BB.
- NEVER write "cutoff", "big blind", "button" as full words. Always normalize:
  · "cutoff" → "CO"
  · "button" → "BTN"
  · "big blind" → "BB"
  · "small blind" → "SB"
  · "hijack" → "HJ"
  · "lojack" → "LJ"
  · "under the gun" → "UTG"
  · "middle position" → "MP"
- If position is genuinely unknown, return "".
- In multiway hands, set villainPosition to the position of the PRIMARY opponent (the one hero played the biggest pot against, usually the one who reached showdown or made the key decision).

STAKES — what this field IS and IS NOT:
- IS: blind levels for cash ("1/3", "2/5", "5/10"), or buy-in for tournaments ("$100", "$1k MTT").
- IS NOT: stack size in BB ("25BB", "80BB" → these go nowhere; do NOT put them in stakes).
- IS NOT: pot size, bet size, or any in-hand amount.
- If stakes are not stated, return "".

VARIANT — default and signals:
- DEFAULT: "nlhe". Set this unless an explicit PLO signal exists.
- PLO signals: the words "PLO", "Omaha", "pot-limit Omaha", "4 cards", or a 4-card hero hand like "AsKsJhTh".
- 5-card hero hand → "plo5".
- Anything else → "other".
- A bad-beat or set-over-set scenario does NOT mean PLO; that is just a NLHE cooler.

FORMAT — signals:
- "cash" if blinds notation like "1/3", "2/5" or the word "cash" appears.
- "tournament" if "torneo", "MTT", "final table", "ITM", "BB stack reference like 25BB", or a buy-in is mentioned.
- Otherwise "unknown".

RESULT and HEROACTION — derive from outcome words:
- "lost X", "perdí X", "got eliminated" → result: "hero_lost", heroResult: numeric loss like "-X".
- "won X", "gané X" → result: "hero_won", heroResult: "+X".
- Hero folded before showdown → result: "no_showdown" (regardless of money lost; heroResult still captures the loss).
- All-in flip resolved → result is "hero_won" or "hero_lost" depending on outcome, NOT "no_showdown".
- If the outcome is unclear → "unknown".

ACTION BY STREET — strict separation:
- preflopAction: only actions BEFORE the flop (opens, 3bets, calls, folds preflop).
- flopAction: only actions AFTER the flop is dealt and BEFORE the turn.
- turnAction: only actions on the turn street.
- riverAction: only actions on the river street.
- Do not mix streets. If a street had no action (folded out, or simply not described), return "".

TAGS — selection rules (this is where models commonly fail):
- Only emit tags from the approved list below. Never invent tags.
- Map actions to tags accurately:
  · Hero bet for value with strong hand → "value-bet" (not "hero-bluff").
  · Hero bet/raised with little equity to fold villain → "bluff" or "hero-bluff".
  · Hero bet with a draw (some equity, fold equity primary) → "semi-bluff".
  · Hero called a big bet with marginal hand → "hero-call".
  · Hero folded → "hero-fold".
  · Hero shoved all-in → "hero-shove".
  · Villain check then raised → "check-raise".
  · "Bet, then called" is NOT a check-raise.
  · Set vs over-set, AA vs KK preflop → "cooler".
  · Hero won the pot → NEVER tag "bad-beat" (bad-beat means hero LOST a hand they were a big favorite in).
- 3bet pot → "3bp"; 4bet pot → "4bp"; single-raised pot → "srp".
- If you are uncertain about a tag, OMIT it. An empty array is acceptable.

KEYMOMENT — only when there is a real decision:
- Should describe the actual decision hero faced and what the user said happened. NEVER invent a different decision.
- For trivial spots (cbet flop and villain folds), you can leave keyMoment empty.
- Do NOT contradict the action: if hero jammed the river, do not write "tanking and folding to a river jam".

Approved tags (English keys only): ${APPROVED_TAGS}

OUTPUT FORMAT — return ONLY valid JSON. No markdown fences, no commentary, no preamble.
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
