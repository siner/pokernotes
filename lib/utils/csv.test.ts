import { describe, it, expect } from 'vitest';
import { buildCsv } from './csv';

const BOM = '﻿';

describe('buildCsv', () => {
  it('builds a CSV with headers only when rows is empty', () => {
    expect(buildCsv(['a', 'b'], [])).toBe(`${BOM}a,b\r\n`);
  });

  it('emits BOM and CRLF line endings', () => {
    const out = buildCsv(['x'], [['1'], ['2']]);
    expect(out.startsWith(BOM)).toBe(true);
    expect(out).toBe(`${BOM}x\r\n1\r\n2\r\n`);
  });

  it('quotes fields containing commas, quotes or newlines and doubles internal quotes', () => {
    const out = buildCsv(
      ['name', 'note'],
      [
        ['Alice', 'plain'],
        ['Bob, Jr.', 'has "quotes"'],
        ['Carol', 'multi\nline'],
      ]
    );
    expect(out).toBe(
      `${BOM}name,note\r\nAlice,plain\r\n"Bob, Jr.","has ""quotes"""\r\nCarol,"multi\nline"\r\n`
    );
  });

  it('renders null and undefined as empty fields', () => {
    expect(buildCsv(['a', 'b', 'c'], [[null, undefined, 'x']])).toBe(`${BOM}a,b,c\r\n,,x\r\n`);
  });

  it('coerces non-string values via String()', () => {
    expect(buildCsv(['n', 'b'], [[42, true]])).toBe(`${BOM}n,b\r\n42,true\r\n`);
  });
});
