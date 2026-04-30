import { describe, it, expect } from 'vitest';
import { parseAiResponse, buildSystemPrompt, buildUserPrompt } from './handStructurer';

describe('parseAiResponse (hand)', () => {
  it('parses a clean JSON response', () => {
    const raw = JSON.stringify({
      title: 'AKo top-two on AK7, fold to turn check-raise',
      summary: 'Hero opens AKo from CO, gets called by BB. Flop AK7 two-tone...',
      variant: 'nlhe',
      format: 'cash',
      stakes: '1/3',
      heroPosition: 'CO',
      villainPosition: 'BB',
      heroHand: 'AKo',
      villainHand: '',
      board: 'AK7dd 4d',
      preflopAction: 'Hero opens to 12, BB calls.',
      flopAction: 'BB donks 25, hero raises to 75, BB calls.',
      turnAction: 'BB check-raises all-in over hero bet.',
      riverAction: '',
      potSize: '~600',
      result: 'no_showdown',
      heroResult: '-200',
      keyMoment: 'Tough check-raise on flush card.',
      tags: ['hero-fold', 'check-raise', 'wet-board'],
      confidence: 0.85,
    });

    const result = parseAiResponse(raw);
    expect(result.title).toContain('AKo');
    expect(result.heroPosition).toBe('CO');
    expect(result.tags).toEqual(['hero-fold', 'check-raise', 'wet-board']);
    expect(result.result).toBe('no_showdown');
  });

  it('extracts JSON from prose-wrapped response', () => {
    const raw = `Sure, here is the structured hand:\n\n{\n  "title": "Set over set",\n  "summary": "Hero flops bottom set, villain has top set.",\n  "tags": ["cooler"],\n  "confidence": 0.95\n}\n\nLet me know if you need adjustments.`;

    const result = parseAiResponse(raw);
    expect(result.title).toBe('Set over set');
    expect(result.tags).toEqual(['cooler']);
  });

  it('filters out invalid tags but keeps valid ones', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Test summary',
      tags: ['hero-fold', 'made-up-tag', 'cooler', 'another-fake'],
    });

    const result = parseAiResponse(raw);
    expect(result.tags).toEqual(['hero-fold', 'cooler']);
  });

  it('falls back to default when result enum is invalid', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Test summary',
      result: 'something-the-model-invented',
    });

    const result = parseAiResponse(raw);
    expect(result.result).toBe('unknown');
  });

  it('falls back to default when variant enum is invalid', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Test summary',
      variant: 'short-deck',
    });

    const result = parseAiResponse(raw);
    expect(result.variant).toBe('nlhe');
  });

  it('uses defaults for missing optional fields', () => {
    const raw = JSON.stringify({
      title: 'Minimal hand',
      summary: 'Just the basics.',
    });

    const result = parseAiResponse(raw);
    expect(result.heroPosition).toBe('');
    expect(result.board).toBe('');
    expect(result.tags).toEqual([]);
    expect(result.confidence).toBe(0.7);
    expect(result.result).toBe('unknown');
  });

  it('throws when title is missing', () => {
    const raw = JSON.stringify({ summary: 'Has summary but no title.' });
    expect(() => parseAiResponse(raw)).toThrow();
  });

  it('throws when summary is missing', () => {
    const raw = JSON.stringify({ title: 'Has title but no summary' });
    expect(() => parseAiResponse(raw)).toThrow();
  });

  it('throws on completely invalid JSON', () => {
    expect(() => parseAiResponse('not json at all')).toThrow();
  });

  it('clamps confidence into [0,1] (rejects out of range)', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      confidence: 1.5,
    });
    // zod min/max should reject — strict by design, retry logic in route handles it.
    expect(() => parseAiResponse(raw)).toThrow();
  });

  it('normalizes position aliases (cutoff → CO, big blind → BB)', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      heroPosition: 'cutoff',
      villainPosition: 'big blind',
    });
    const result = parseAiResponse(raw);
    expect(result.heroPosition).toBe('CO');
    expect(result.villainPosition).toBe('BB');
  });

  it('normalizes case-insensitive position aliases', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      heroPosition: 'Button',
      villainPosition: 'HiJack',
    });
    const result = parseAiResponse(raw);
    expect(result.heroPosition).toBe('BTN');
    expect(result.villainPosition).toBe('HJ');
  });

  it('keeps already-canonical positions as-is', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      heroPosition: 'CO',
      villainPosition: 'BTN',
    });
    const result = parseAiResponse(raw);
    expect(result.heroPosition).toBe('CO');
    expect(result.villainPosition).toBe('BTN');
  });

  it('strips stack sizes from stakes (25BB → empty)', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      stakes: '25BB',
    });
    const result = parseAiResponse(raw);
    expect(result.stakes).toBe('');
  });

  it('strips "80 big blinds" from stakes', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      stakes: '80 big blinds',
    });
    const result = parseAiResponse(raw);
    expect(result.stakes).toBe('');
  });

  it('keeps real cash stakes as-is', () => {
    const raw = JSON.stringify({
      title: 'Test',
      summary: 'Summary',
      stakes: '2/5',
    });
    const result = parseAiResponse(raw);
    expect(result.stakes).toBe('2/5');
  });
});

describe('buildSystemPrompt (hand)', () => {
  it('includes all approved hand tags', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('hero-fold');
    expect(prompt).toContain('check-raise');
    expect(prompt).toContain('cooler');
    expect(prompt).toContain('wet-board');
  });

  it('emits an English directive twice for en', () => {
    const prompt = buildSystemPrompt('en');
    const matches = prompt.match(/OUTPUT LANGUAGE: ENGLISH/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('emits a Spanish directive twice for es', () => {
    const prompt = buildSystemPrompt('es');
    const matches = prompt.match(/IDIOMA DE SALIDA: ESPAÑOL/g) ?? [];
    expect(matches.length).toBeGreaterThanOrEqual(2);
    expect(prompt).not.toContain('OUTPUT LANGUAGE: ENGLISH');
  });

  it('one-shot for en uses Spanish input to force language switch', () => {
    const prompt = buildSystemPrompt('en');
    // The user portion of the example contains Spanish; the assistant portion is English
    expect(prompt).toContain('abrí desde CO');
    expect(prompt).toContain('Hero opens AKo from CO');
  });

  it('one-shot for es uses English input to force language switch', () => {
    const prompt = buildSystemPrompt('es');
    expect(prompt).toContain('opened to 12 from CO');
    expect(prompt).toContain('Hero abre AKo desde CO');
  });

  it('keeps tag keys in English even in Spanish prompt', () => {
    const prompt = buildSystemPrompt('es');
    expect(prompt).toContain('hero-fold');
    expect(prompt).toContain('check-raise');
  });

  it('explicitly forbids inventing details', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/NEVER invent/i);
  });

  it('includes negative examples of common AI mistakes', () => {
    const prompt = buildSystemPrompt('en');
    // The prompt should include explicit "do NOT do this" anti-patterns
    expect(prompt).toMatch(/Examples of what NOT to do/i);
    expect(prompt).toContain('set is the hand type');
  });

  it('locks position taxonomy with normalization rules', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('cutoff');
    expect(prompt).toContain('"CO"');
    expect(prompt).toContain('"BTN"');
    expect(prompt).toMatch(/STRICT TAXONOMY/);
  });

  it('clarifies stakes vs stack size', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toMatch(/IS NOT.*stack size/i);
    expect(prompt).toContain('25BB');
  });

  it('forces NLHE default unless explicit PLO signal', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('DEFAULT: "nlhe"');
    expect(prompt).toMatch(/PLO signals/i);
  });

  it('includes tag selection guidance with action mapping', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('value-bet');
    expect(prompt).toMatch(/bad-beat means hero LOST/i);
  });
});

describe('buildUserPrompt (hand)', () => {
  it('includes the raw description', () => {
    const prompt = buildUserPrompt('Opened KK from UTG, got 3bet by BTN...');
    expect(prompt).toContain('Opened KK from UTG');
  });

  it('mentions the player nickname when provided', () => {
    const prompt = buildUserPrompt('test hand', { playerNickname: 'Big Hat Guy' });
    expect(prompt).toContain('Big Hat Guy');
  });

  it('omits player context when nickname is missing', () => {
    const prompt = buildUserPrompt('test hand');
    expect(prompt).not.toContain('primary opponent');
  });
});
