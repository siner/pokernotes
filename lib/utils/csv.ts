function escapeField(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// UTF-8 BOM so Excel detects the encoding correctly.
const BOM = '﻿';

export function buildCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<unknown>>
): string {
  const lines: string[] = [headers.map(escapeField).join(',')];
  for (const row of rows) {
    lines.push(row.map(escapeField).join(','));
  }
  return BOM + lines.join('\r\n') + '\r\n';
}
