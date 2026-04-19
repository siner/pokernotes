import { describe, it, expect } from 'vitest';
import { parseAiResponse, buildSystemPrompt, buildUserPrompt } from './noteStructurer';

describe('parseAiResponse', () => {
  it('parses a clean JSON response', () => {
    const raw = JSON.stringify({
      suggestedTags: ['fish', 'calling-station'],
      structuredSummary: 'Passive player who calls too wide.',
      preflopTendency: 'Calls raises with weak hands.',
      postflopTendency: 'Check-calls most streets.',
      confidence: 0.9,
    });

    const result = parseAiResponse(raw);
    expect(result.suggestedTags).toEqual(['fish', 'calling-station']);
    expect(result.structuredSummary).toBe('Passive player who calls too wide.');
    expect(result.confidence).toBe(0.9);
  });

  it('extracts JSON from prose-wrapped response', () => {
    const raw = `Here is the analysis:\n{\n  "suggestedTags": ["aggro"],\n  "structuredSummary": "Very aggressive player.",\n  "preflopTendency": "3bets frequently.",\n  "postflopTendency": "Bets most streets.",\n  "confidence": 0.85\n}\nHope this helps!`;

    const result = parseAiResponse(raw);
    expect(result.suggestedTags).toEqual(['aggro']);
  });

  it('filters out invalid tags', () => {
    const raw = JSON.stringify({
      suggestedTags: ['fish', 'invalid-tag', 'maniac', 'another-bad-tag'],
      structuredSummary: 'Test summary.',
      preflopTendency: '',
      postflopTendency: '',
      confidence: 0.7,
    });

    const result = parseAiResponse(raw);
    expect(result.suggestedTags).toEqual(['fish', 'maniac']);
  });

  it('uses defaults for missing optional fields', () => {
    const raw = JSON.stringify({
      suggestedTags: ['nit'],
      structuredSummary: 'Very tight player.',
    });

    const result = parseAiResponse(raw);
    expect(result.preflopTendency).toBe('');
    expect(result.postflopTendency).toBe('');
    expect(result.confidence).toBe(0.8);
  });

  it('throws on completely invalid JSON', () => {
    expect(() => parseAiResponse('not json at all')).toThrow();
  });

  it('throws when structuredSummary is missing', () => {
    const raw = JSON.stringify({ suggestedTags: ['fish'] });
    expect(() => parseAiResponse(raw)).toThrow();
  });
});

describe('buildSystemPrompt', () => {
  it('includes approved tags', () => {
    const prompt = buildSystemPrompt('en');
    expect(prompt).toContain('fish');
    expect(prompt).toContain('aggro');
    expect(prompt).toContain('calling-station');
  });

  it('sets language to Spanish when locale is es', () => {
    const prompt = buildSystemPrompt('es');
    expect(prompt).toContain('Spanish');
  });
});

describe('buildUserPrompt', () => {
  it('includes the raw note', () => {
    const prompt = buildUserPrompt('Called my river shove with second pair');
    expect(prompt).toContain('Called my river shove with second pair');
  });

  it('mentions existing tags when provided', () => {
    const prompt = buildUserPrompt('test note', ['fish', 'passive']);
    expect(prompt).toContain('fish');
    expect(prompt).toContain('passive');
  });
});
