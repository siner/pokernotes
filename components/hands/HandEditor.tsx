'use client';

import { useMemo, useState } from 'react';
import { Loader2, X, AlertCircle, Sparkles } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type Card, cardToString, parseCard } from '@/lib/equity/cards';
import { HAND_TAGS, POSITIONS } from '@/lib/hands/tags';
import type { Hand } from '@/lib/storage';
import { CardPickerSheet, CardSlot } from './CardPickerSheet';

interface StructuredHand {
  title: string;
  summary: string;
  variant?: string;
  format?: string;
  stakes?: string;
  heroPosition?: string;
  villainPosition?: string;
  heroHand?: string;
  villainHand?: string;
  board?: string;
  preflopAction?: string;
  flopAction?: string;
  turnAction?: string;
  riverAction?: string;
  potSize?: string;
  result?: string;
  heroResult?: string;
  keyMoment?: string;
  tags?: string[];
  confidence?: number;
}

const VARIANTS = ['nlhe', 'plo', 'plo5', 'other'] as const;
const FORMATS = ['cash', 'tournament', 'unknown'] as const;
const RESULTS = ['hero_won', 'hero_lost', 'split', 'no_showdown', 'unknown'] as const;

interface HandEditorProps {
  hand: Hand;
  playerNickname?: string;
  onSave: (next: Omit<Hand, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

type Selection =
  | { kind: 'hero'; idx: 0 | 1 }
  | { kind: 'villain'; idx: 0 | 1 }
  | { kind: 'board'; idx: 0 | 1 | 2 | 3 | 4 };

type HandSlots = [Card | null, Card | null];
type BoardSlots = [Card | null, Card | null, Card | null, Card | null, Card | null];

/**
 * Tries to read two specific cards from the AI's `heroHand` field.
 * Returns [null, null] for non-explicit notation like "AKo" or "QQ".
 */
function parseHandSlots(input: string | undefined): HandSlots {
  if (!input) return [null, null];
  const cleaned = input.replace(/10/g, 'T').replace(/[\s,;|/]+/g, '');
  // Need exactly 4 chars (rank+suit) × 2.
  if (cleaned.length !== 4) return [null, null];
  try {
    const a = parseCard(cleaned.slice(0, 2));
    const b = parseCard(cleaned.slice(2, 4));
    return [a, b];
  } catch {
    return [null, null];
  }
}

function parseBoardSlots(input: string | undefined): BoardSlots {
  const slots: BoardSlots = [null, null, null, null, null];
  if (!input) return slots;
  const cleaned = input
    .replace(/10/g, 'T')
    .replace(/[\s,;|/]+/g, ' ')
    .trim();
  // Walk char by char looking for rank+suit pairs.
  const found: Card[] = [];
  let i = 0;
  while (i < cleaned.length && found.length < 5) {
    const ch = cleaned[i];
    if (ch === ' ') {
      i += 1;
      continue;
    }
    const next = cleaned[i + 1];
    if (!next || next === ' ') {
      i += 1;
      continue;
    }
    try {
      found.push(parseCard(`${ch}${next}`));
      i += 2;
    } catch {
      i += 1;
    }
  }
  for (let k = 0; k < found.length && k < 5; k++) slots[k] = found[k];
  return slots;
}

function serializeHand(slots: HandSlots, fallback: string): string {
  if (slots[0] && slots[1]) {
    return `${cardToString(slots[0])}${cardToString(slots[1])}`;
  }
  // Preserve free-form input like "AKo", "QQ" when slots are not both filled.
  return fallback.trim();
}

function serializeBoard(slots: BoardSlots): string {
  const flop = slots
    .slice(0, 3)
    .filter((c): c is Card => c !== null)
    .map(cardToString)
    .join('');
  const turn = slots[3] ? cardToString(slots[3]) : '';
  const river = slots[4] ? cardToString(slots[4]) : '';
  if (!flop && !turn && !river) return '';
  const parts: string[] = [];
  if (flop) parts.push(flop);
  if (turn) parts.push(turn);
  if (river) parts.push(river);
  return parts.join(' ');
}

function MissingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-wider text-amber-300">
      <AlertCircle size={10} />
      {label}
    </span>
  );
}

function SectionHeader({
  title,
  missing,
  missingLabel,
}: {
  title: string;
  missing: boolean;
  missingLabel: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-2">
      <h4 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {title}
      </h4>
      {missing && <MissingPill label={missingLabel} />}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
  labelFor,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  labelFor: (v: T) => string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-slate-200'
            }`}
          >
            {labelFor(opt)}
          </button>
        );
      })}
    </div>
  );
}

export function HandEditor({ hand, playerNickname, onSave, onClose }: HandEditorProps) {
  const t = useTranslations('hands.editor');
  const tView = useTranslations('hands.view');
  const tComposer = useTranslations('hands.composer');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'en' | 'es';

  const initial = (hand.structuredData as unknown as StructuredHand) ?? {};

  const [title, setTitle] = useState(initial.title ?? '');
  const [summary, setSummary] = useState(initial.summary ?? '');
  const [rawDescription, setRawDescription] = useState(hand.rawDescription);

  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>(
    (VARIANTS as readonly string[]).includes(initial.variant ?? '')
      ? (initial.variant as (typeof VARIANTS)[number])
      : 'nlhe'
  );
  const [format, setFormat] = useState<(typeof FORMATS)[number]>(
    (FORMATS as readonly string[]).includes(initial.format ?? '')
      ? (initial.format as (typeof FORMATS)[number])
      : 'unknown'
  );
  const [stakes, setStakes] = useState(initial.stakes ?? '');

  const [heroPosition, setHeroPosition] = useState(initial.heroPosition ?? '');
  const [villainPosition, setVillainPosition] = useState(initial.villainPosition ?? '');

  const [heroSlots, setHeroSlots] = useState<HandSlots>(() => parseHandSlots(initial.heroHand));
  const [villainSlots, setVillainSlots] = useState<HandSlots>(() =>
    parseHandSlots(initial.villainHand)
  );
  const [heroFallback, setHeroFallback] = useState(initial.heroHand ?? '');
  const [villainFallback, setVillainFallback] = useState(initial.villainHand ?? '');

  const [boardSlots, setBoardSlots] = useState<BoardSlots>(() => parseBoardSlots(initial.board));

  const [preflopAction, setPreflopAction] = useState(initial.preflopAction ?? '');
  const [flopAction, setFlopAction] = useState(initial.flopAction ?? '');
  const [turnAction, setTurnAction] = useState(initial.turnAction ?? '');
  const [riverAction, setRiverAction] = useState(initial.riverAction ?? '');

  const [potSize, setPotSize] = useState(initial.potSize ?? '');
  const [result, setResult] = useState<(typeof RESULTS)[number]>(
    (RESULTS as readonly string[]).includes(initial.result ?? '')
      ? (initial.result as (typeof RESULTS)[number])
      : 'unknown'
  );
  const [heroResult, setHeroResult] = useState(initial.heroResult ?? '');
  const [keyMoment, setKeyMoment] = useState(initial.keyMoment ?? '');
  const [tags, setTags] = useState<Set<string>>(new Set(initial.tags ?? []));

  const [picker, setPicker] = useState<Selection | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiHint, setAiHint] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  /**
   * Re-runs the AI structurer with the current rawDescription plus an optional
   * user hint. The hint also bumps the AI temperature server-side so we don't
   * just get the same deterministic output back. Result is loaded straight
   * into the form fields — the user still has to press Save.
   */
  async function handleRegenerate() {
    if (rawDescription.trim().length < 20 || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/structure-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: rawDescription,
          playerNickname,
          locale,
          hint: aiHint.trim() ? aiHint.trim() : undefined,
        }),
      });
      if (res.status === 403) {
        setAiError(tComposer('proRequired'));
        return;
      }
      if (res.status === 429) {
        setAiError(tComposer('rateLimited'));
        return;
      }
      if (!res.ok) {
        setAiError(tComposer('aiError'));
        return;
      }
      const next = (await res.json()) as StructuredHand;

      setTitle(next.title ?? '');
      setSummary(next.summary ?? '');
      if ((VARIANTS as readonly string[]).includes(next.variant ?? '')) {
        setVariant(next.variant as (typeof VARIANTS)[number]);
      }
      if ((FORMATS as readonly string[]).includes(next.format ?? '')) {
        setFormat(next.format as (typeof FORMATS)[number]);
      }
      setStakes(next.stakes ?? '');
      setHeroPosition(next.heroPosition ?? '');
      setVillainPosition(next.villainPosition ?? '');
      setHeroSlots(parseHandSlots(next.heroHand));
      setVillainSlots(parseHandSlots(next.villainHand));
      setHeroFallback(next.heroHand ?? '');
      setVillainFallback(next.villainHand ?? '');
      setBoardSlots(parseBoardSlots(next.board));
      setPreflopAction(next.preflopAction ?? '');
      setFlopAction(next.flopAction ?? '');
      setTurnAction(next.turnAction ?? '');
      setRiverAction(next.riverAction ?? '');
      setPotSize(next.potSize ?? '');
      if ((RESULTS as readonly string[]).includes(next.result ?? '')) {
        setResult(next.result as (typeof RESULTS)[number]);
      }
      setHeroResult(next.heroResult ?? '');
      setKeyMoment(next.keyMoment ?? '');
      setTags(new Set(next.tags ?? []));
      setAiHint('');
    } catch {
      setAiError(tComposer('aiError'));
    } finally {
      setAiLoading(false);
    }
  }

  // Cards used across the form, for the picker's disable set.
  const usedCards = useMemo(() => {
    const set = new Set<string>();
    for (const c of heroSlots) if (c) set.add(cardToString(c));
    for (const c of villainSlots) if (c) set.add(cardToString(c));
    for (const c of boardSlots) if (c) set.add(cardToString(c));
    return set;
  }, [heroSlots, villainSlots, boardSlots]);

  function pickCard(card: Card) {
    if (!picker) return;
    if (picker.kind === 'hero') {
      setHeroSlots((prev) => {
        const next = [...prev] as HandSlots;
        next[picker.idx] = card;
        return next;
      });
    } else if (picker.kind === 'villain') {
      setVillainSlots((prev) => {
        const next = [...prev] as HandSlots;
        next[picker.idx] = card;
        return next;
      });
    } else {
      setBoardSlots((prev) => {
        const next = [...prev] as BoardSlots;
        next[picker.idx] = card;
        return next;
      });
    }
    setPicker(null);
  }

  function clearSlot(sel: Selection) {
    if (sel.kind === 'hero') {
      setHeroSlots((prev) => {
        const next = [...prev] as HandSlots;
        next[sel.idx] = null;
        return next;
      });
    } else if (sel.kind === 'villain') {
      setVillainSlots((prev) => {
        const next = [...prev] as HandSlots;
        next[sel.idx] = null;
        return next;
      });
    } else {
      setBoardSlots((prev) => {
        const next = [...prev] as BoardSlots;
        next[sel.idx] = null;
        return next;
      });
    }
  }

  function toggleTag(tag: string) {
    setTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  async function handleSave() {
    if (!title.trim() || !summary.trim()) return;
    setSaving(true);
    try {
      const structured: StructuredHand = {
        title: title.trim(),
        summary: summary.trim(),
        variant,
        format,
        stakes: stakes.trim(),
        heroPosition: heroPosition.trim(),
        villainPosition: villainPosition.trim(),
        heroHand: serializeHand(heroSlots, heroFallback),
        villainHand: serializeHand(villainSlots, villainFallback),
        board: serializeBoard(boardSlots),
        preflopAction: preflopAction.trim(),
        flopAction: flopAction.trim(),
        turnAction: turnAction.trim(),
        riverAction: riverAction.trim(),
        potSize: potSize.trim(),
        result,
        heroResult: heroResult.trim(),
        keyMoment: keyMoment.trim(),
        tags: Array.from(tags),
        confidence: initial.confidence ?? 0.7,
      };

      await onSave({
        playerId: hand.playerId,
        sessionId: hand.sessionId,
        rawDescription: rawDescription.trim(),
        structuredData: structured as unknown as Record<string, unknown>,
        aiProcessed: true,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const missingLabel = t('missing');
  const missingHero = !heroSlots[0] && !heroSlots[1] && !heroFallback.trim();
  const missingVillain = !villainSlots[0] && !villainSlots[1] && !villainFallback.trim();
  const missingBoard = boardSlots.every((c) => c === null);
  const missingActions =
    !preflopAction.trim() && !flopAction.trim() && !turnAction.trim() && !riverAction.trim();
  const missingResult = result === 'unknown' && !heroResult.trim();

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="my-0 w-full max-w-xl rounded-t-2xl border border-slate-800 bg-slate-950 sm:my-8 sm:rounded-2xl">
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-white">{t('title')}</h3>
            {playerNickname && (
              <p className="mt-0.5 text-xs text-slate-500">{t('vs', { name: playerNickname })}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon('close')}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-5 px-5 py-5">
          {/* Regenerate with AI */}
          <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                {t('regenerate.title')}
              </span>
            </div>
            <p className="mb-2 text-xs text-slate-400">{t('regenerate.help')}</p>
            <textarea
              value={aiHint}
              onChange={(e) => setAiHint(e.target.value)}
              placeholder={tComposer('hintPlaceholder')}
              rows={2}
              maxLength={800}
              disabled={aiLoading}
              className="mb-2 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-60"
            />
            {aiError && <p className="mb-2 text-xs text-amber-400">{aiError}</p>}
            <button
              type="button"
              onClick={handleRegenerate}
              disabled={aiLoading || rawDescription.trim().length < 20}
              className="flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {aiLoading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {tComposer('aiProcessing')}
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  {t('regenerate.button')}
                </>
              )}
            </button>
          </section>

          {/* Title + summary */}
          <section>
            <SectionHeader
              title={t('sections.headline')}
              missing={!title.trim() || !summary.trim()}
              missingLabel={missingLabel}
            />
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('fields.titlePlaceholder')}
              maxLength={140}
              className="mb-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={t('fields.summaryPlaceholder')}
              rows={3}
              maxLength={800}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
          </section>

          {/* Format / variant / stakes */}
          <section>
            <SectionHeader
              title={t('sections.format')}
              missing={format === 'unknown' && !stakes.trim()}
              missingLabel={missingLabel}
            />
            <div className="mb-2">
              <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.format')}</p>
              <Segmented
                value={format}
                options={FORMATS}
                onChange={setFormat}
                labelFor={(v) =>
                  v === 'unknown' ? t('unknown') : tView(`format.${v}` as 'format.cash')
                }
              />
            </div>
            <div className="mb-2">
              <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.variant')}</p>
              <Segmented
                value={variant}
                options={VARIANTS}
                onChange={setVariant}
                labelFor={(v) => t(`variant.${v}` as 'variant.nlhe')}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.stakes')}</p>
              <input
                type="text"
                value={stakes}
                onChange={(e) => setStakes(e.target.value)}
                placeholder={t('fields.stakesPlaceholder')}
                maxLength={60}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>
          </section>

          {/* Hero */}
          <section>
            <SectionHeader
              title={t('sections.hero')}
              missing={missingHero || !heroPosition}
              missingLabel={missingLabel}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.position')}</p>
                <PositionSelect
                  value={heroPosition}
                  onChange={setHeroPosition}
                  emptyLabel={t('unknown')}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.cards')}</p>
                <div className="flex gap-2">
                  <CardSlot
                    card={heroSlots[0]}
                    selected={picker?.kind === 'hero' && picker.idx === 0}
                    onClick={() => setPicker({ kind: 'hero', idx: 0 })}
                    onClear={() => clearSlot({ kind: 'hero', idx: 0 })}
                    ariaLabel={t('aria.heroCard', { n: 1 })}
                  />
                  <CardSlot
                    card={heroSlots[1]}
                    selected={picker?.kind === 'hero' && picker.idx === 1}
                    onClick={() => setPicker({ kind: 'hero', idx: 1 })}
                    onClear={() => clearSlot({ kind: 'hero', idx: 1 })}
                    ariaLabel={t('aria.heroCard', { n: 2 })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2">
              <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.cardsRaw')}</p>
              <input
                type="text"
                value={heroFallback}
                onChange={(e) => setHeroFallback(e.target.value)}
                placeholder={t('fields.cardsRawPlaceholder')}
                maxLength={20}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>
          </section>

          {/* Villain */}
          <section>
            <SectionHeader
              title={t('sections.villain')}
              missing={missingVillain || !villainPosition}
              missingLabel={missingLabel}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.position')}</p>
                <PositionSelect
                  value={villainPosition}
                  onChange={setVillainPosition}
                  emptyLabel={t('unknown')}
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.cards')}</p>
                <div className="flex gap-2">
                  <CardSlot
                    card={villainSlots[0]}
                    selected={picker?.kind === 'villain' && picker.idx === 0}
                    onClick={() => setPicker({ kind: 'villain', idx: 0 })}
                    onClear={() => clearSlot({ kind: 'villain', idx: 0 })}
                    ariaLabel={t('aria.villainCard', { n: 1 })}
                  />
                  <CardSlot
                    card={villainSlots[1]}
                    selected={picker?.kind === 'villain' && picker.idx === 1}
                    onClick={() => setPicker({ kind: 'villain', idx: 1 })}
                    onClear={() => clearSlot({ kind: 'villain', idx: 1 })}
                    ariaLabel={t('aria.villainCard', { n: 2 })}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2">
              <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.cardsRaw')}</p>
              <input
                type="text"
                value={villainFallback}
                onChange={(e) => setVillainFallback(e.target.value)}
                placeholder={t('fields.cardsRawPlaceholder')}
                maxLength={20}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
              />
            </div>
          </section>

          {/* Board */}
          <section>
            <SectionHeader
              title={t('sections.board')}
              missing={missingBoard}
              missingLabel={missingLabel}
            />
            <div className="flex items-end justify-around gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <BoardGroup label={tView('flop')}>
                {[0, 1, 2].map((i) => (
                  <CardSlot
                    key={i}
                    size="sm"
                    card={boardSlots[i]}
                    selected={picker?.kind === 'board' && picker.idx === i}
                    onClick={() => setPicker({ kind: 'board', idx: i as 0 | 1 | 2 })}
                    onClear={() => clearSlot({ kind: 'board', idx: i as 0 | 1 | 2 })}
                    ariaLabel={t('aria.flopCard', { n: i + 1 })}
                  />
                ))}
              </BoardGroup>
              <BoardGroup label={tView('turn')}>
                <CardSlot
                  size="sm"
                  card={boardSlots[3]}
                  selected={picker?.kind === 'board' && picker.idx === 3}
                  onClick={() => setPicker({ kind: 'board', idx: 3 })}
                  onClear={() => clearSlot({ kind: 'board', idx: 3 })}
                  ariaLabel={t('aria.turnCard')}
                />
              </BoardGroup>
              <BoardGroup label={tView('river')}>
                <CardSlot
                  size="sm"
                  card={boardSlots[4]}
                  selected={picker?.kind === 'board' && picker.idx === 4}
                  onClick={() => setPicker({ kind: 'board', idx: 4 })}
                  onClear={() => clearSlot({ kind: 'board', idx: 4 })}
                  ariaLabel={t('aria.riverCard')}
                />
              </BoardGroup>
            </div>
          </section>

          {/* Action by street */}
          <section>
            <SectionHeader
              title={t('sections.action')}
              missing={missingActions}
              missingLabel={missingLabel}
            />
            <div className="flex flex-col gap-2">
              <StreetField
                label={tView('preflop')}
                value={preflopAction}
                onChange={setPreflopAction}
                placeholder={t('fields.actionPlaceholder')}
              />
              <StreetField
                label={tView('flop')}
                value={flopAction}
                onChange={setFlopAction}
                placeholder={t('fields.actionPlaceholder')}
              />
              <StreetField
                label={tView('turn')}
                value={turnAction}
                onChange={setTurnAction}
                placeholder={t('fields.actionPlaceholder')}
              />
              <StreetField
                label={tView('river')}
                value={riverAction}
                onChange={setRiverAction}
                placeholder={t('fields.actionPlaceholder')}
              />
            </div>
          </section>

          {/* Pot + result + heroResult */}
          <section>
            <SectionHeader
              title={t('sections.outcome')}
              missing={missingResult}
              missingLabel={missingLabel}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{tView('potSize')}</p>
                <input
                  type="text"
                  value={potSize}
                  onChange={(e) => setPotSize(e.target.value)}
                  placeholder={t('fields.potSizePlaceholder')}
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
                />
              </div>
              <div>
                <p className="mb-1.5 text-[11px] text-slate-500">{t('fields.heroResult')}</p>
                <input
                  type="text"
                  value={heroResult}
                  onChange={(e) => setHeroResult(e.target.value)}
                  placeholder={t('fields.heroResultPlaceholder')}
                  maxLength={40}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-2">
              <p className="mb-1.5 text-[11px] text-slate-500">{tView('result.label')}</p>
              <Segmented
                value={result}
                options={RESULTS}
                onChange={setResult}
                labelFor={(v) =>
                  v === 'unknown' ? t('unknown') : tView(`result.${v}` as 'result.hero_won')
                }
              />
            </div>
          </section>

          {/* Key moment */}
          <section>
            <SectionHeader
              title={t('sections.keyMoment')}
              missing={!keyMoment.trim()}
              missingLabel={missingLabel}
            />
            <textarea
              value={keyMoment}
              onChange={(e) => setKeyMoment(e.target.value)}
              placeholder={t('fields.keyMomentPlaceholder')}
              rows={2}
              maxLength={400}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
          </section>

          {/* Tags */}
          <section>
            <SectionHeader
              title={t('sections.tags')}
              missing={tags.size === 0}
              missingLabel={missingLabel}
            />
            <div className="flex flex-wrap gap-1.5">
              {HAND_TAGS.map((tag) => {
                const active = tags.has(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold transition-colors ${
                      active
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                        : 'border-slate-700 bg-slate-900 text-slate-500 hover:border-slate-600 hover:text-slate-300'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Raw description (read/edit) */}
          <section>
            <SectionHeader
              title={t('sections.rawDescription')}
              missing={false}
              missingLabel={missingLabel}
            />
            <textarea
              value={rawDescription}
              onChange={(e) => setRawDescription(e.target.value)}
              rows={3}
              maxLength={8000}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm leading-relaxed text-slate-300 placeholder-slate-500 focus:border-slate-600 focus:outline-none"
            />
          </section>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 flex gap-2 border-t border-slate-800 bg-slate-950 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="min-h-[44px] flex-1 rounded-xl border border-slate-700 px-3 text-sm font-medium text-slate-300 hover:bg-slate-900 disabled:opacity-50"
          >
            {tCommon('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !title.trim() || !summary.trim()}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : t('save')}
          </button>
        </div>
      </div>

      {picker && (
        <CardPickerSheet
          title={pickerTitle(picker, t)}
          usedCards={usedCards}
          onPick={pickCard}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  );
}

function pickerTitle(
  sel: Selection,
  t: ReturnType<typeof useTranslations<'hands.editor'>>
): string {
  if (sel.kind === 'hero') return t('picker.hero', { n: sel.idx + 1 });
  if (sel.kind === 'villain') return t('picker.villain', { n: sel.idx + 1 });
  if (sel.idx < 3) return t('picker.flop', { n: sel.idx + 1 });
  if (sel.idx === 3) return t('picker.turn');
  return t('picker.river');
}

function PositionSelect({
  value,
  onChange,
  emptyLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  emptyLabel: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-[44px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm font-mono text-white focus:border-slate-600 focus:outline-none"
    >
      <option value="">{emptyLabel}</option>
      {POSITIONS.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

function BoardGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
        {label}
      </span>
      <div className="flex gap-1.5">{children}</div>
    </div>
  );
}

function StreetField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="flex gap-2">
      <span className="mt-1.5 inline-flex h-6 w-14 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800/80 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={1}
        maxLength={500}
        className="min-h-[44px] flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
      />
    </div>
  );
}
