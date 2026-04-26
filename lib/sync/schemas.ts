import { z } from 'zod';

const dateLike = z.union([z.string(), z.number(), z.date()]).transform((v) => new Date(v));

// D1 returns SQL NULL → JSON null for unset columns. Round-tripping through
// the client (sync pull → IndexedDB → sync push) preserves nulls. Use these
// helpers to accept null|undefined and normalize to undefined so handlers
// downstream don't have to care.
const optStr = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((v) => v ?? undefined);

const optNonEmptyStr = (max: number) =>
  z
    .string()
    .min(1)
    .max(max)
    .nullish()
    .transform((v) => v ?? undefined);

const optDateLike = z
  .union([z.string(), z.number(), z.date(), z.null()])
  .nullish()
  .transform((v) => (v === null || v === undefined ? undefined : new Date(v)));

const optStrArray = z
  .array(z.string())
  .nullish()
  .transform((v) => v ?? []);

const optBool = (defaultValue: boolean) =>
  z
    .boolean()
    .nullish()
    .transform((v) => v ?? defaultValue);

export const PlayerPayloadSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().min(1).max(100),
  description: optStr(2000),
  photoUrl: optNonEmptyStr(500),
  tags: optStrArray,
  timesPlayed: z.number().int().nonnegative().default(0),
  firstSeenAt: optDateLike,
  lastSeenAt: optDateLike,
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const PlayerPatchSchema = PlayerPayloadSchema.partial().extend({
  updatedAt: dateLike,
});

export const NotePayloadSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  sessionId: optStr(200),
  rawNote: optStr(4000),
  structuredSummary: optStr(4000),
  preflopTendency: optStr(2000),
  postflopTendency: optStr(2000),
  aiSuggestedTags: optStrArray,
  aiProcessed: optBool(false),
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const SessionPayloadSchema = z.object({
  id: z.string().min(1),
  name: optStr(200),
  venue: optStr(200),
  gameType: optStr(100),
  startedAt: optDateLike,
  endedAt: optDateLike,
  notes: optStr(4000),
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const SessionPatchSchema = SessionPayloadSchema.partial().extend({
  updatedAt: dateLike,
});

export const SyncImportSchema = z.object({
  players: z.array(PlayerPayloadSchema).default([]),
  notes: z.array(NotePayloadSchema).default([]),
  sessions: z.array(SessionPayloadSchema).default([]),
});

export type PlayerPayload = z.infer<typeof PlayerPayloadSchema>;
export type NotePayload = z.infer<typeof NotePayloadSchema>;
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;
export type SyncImportPayload = z.infer<typeof SyncImportSchema>;
