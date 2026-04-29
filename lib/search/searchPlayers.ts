import type { Note, Player } from '@/lib/storage';

export interface SearchMatch {
  player: Player;
  noteMatchCount: number;
}

function normalize(s: string | undefined | null): string {
  if (!s) return '';
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function playerHaystack(player: Player): string {
  return [player.nickname, player.description ?? '', player.tags.join(' ')]
    .map(normalize)
    .join(' ');
}

function noteHaystack(note: Note): string {
  return [
    note.rawNote ?? '',
    note.structuredSummary ?? '',
    note.preflopTendency ?? '',
    note.postflopTendency ?? '',
    note.aiSuggestedTags.join(' '),
  ]
    .map(normalize)
    .join(' ');
}

/**
 * Token-AND search across player fields and that player's notes.
 * Returns matched players sorted with note-only matches after field matches,
 * and within each group preserving the input order (callers pre-sort by recency).
 */
export function searchPlayers(players: Player[], notes: Note[], query: string): SearchMatch[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return players.map((player) => ({ player, noteMatchCount: 0 }));
  }

  const notesByPlayer = new Map<string, Note[]>();
  for (const note of notes) {
    const list = notesByPlayer.get(note.playerId);
    if (list) list.push(note);
    else notesByPlayer.set(note.playerId, [note]);
  }

  const fieldMatches: SearchMatch[] = [];
  const noteOnlyMatches: SearchMatch[] = [];

  for (const player of players) {
    const fieldHay = playerHaystack(player);
    const fieldHit = tokens.every((t) => fieldHay.includes(t));

    const playerNotes = notesByPlayer.get(player.id) ?? [];
    let noteMatchCount = 0;
    for (const note of playerNotes) {
      const noteHay = noteHaystack(note);
      if (tokens.every((t) => noteHay.includes(t))) noteMatchCount++;
    }

    if (fieldHit) {
      fieldMatches.push({ player, noteMatchCount });
    } else if (noteMatchCount > 0) {
      noteOnlyMatches.push({ player, noteMatchCount });
    }
  }

  return [...fieldMatches, ...noteOnlyMatches];
}
