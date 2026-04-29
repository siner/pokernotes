import { describe, it, expect } from 'vitest';
import { resetPasswordTemplate, verifyEmailTemplate, welcomeProTemplate } from './templates';

describe('resetPasswordTemplate', () => {
  it('returns English content for en locale', () => {
    const r = resetPasswordTemplate('en', { name: 'Fran', url: 'https://x/abc' });
    expect(r.subject).toMatch(/Reset/i);
    expect(r.text).toContain('Hi Fran');
    expect(r.text).toContain('https://x/abc');
  });

  it('returns Spanish content for es locale', () => {
    const r = resetPasswordTemplate('es', { name: 'Fran', url: 'https://x/abc' });
    expect(r.subject).toMatch(/contraseña/i);
    expect(r.text).toContain('Hola Fran');
    expect(r.text).toContain('https://x/abc');
  });

  it('falls back to English for unknown locales', () => {
    const r = resetPasswordTemplate('fr', { url: 'https://x' });
    expect(r.subject).toMatch(/Reset/i);
  });

  it('omits name from greeting when not provided', () => {
    const r = resetPasswordTemplate('en', { url: 'https://x' });
    expect(r.text.startsWith('Hi,')).toBe(true);
    const es = resetPasswordTemplate('es', { url: 'https://x' });
    expect(es.text.startsWith('Hola,')).toBe(true);
  });
});

describe('verifyEmailTemplate', () => {
  it('localizes subject and includes the verification url', () => {
    const en = verifyEmailTemplate('en', { name: 'Mike', url: 'https://verify/123' });
    expect(en.subject).toMatch(/Verify/i);
    expect(en.text).toContain('https://verify/123');

    const es = verifyEmailTemplate('es', { name: 'Mike', url: 'https://verify/123' });
    expect(es.subject).toMatch(/Verifica/i);
    expect(es.text).toContain('Hola Mike');
    expect(es.text).toContain('https://verify/123');
  });

  it('falls back to English for null/undefined locale', () => {
    expect(verifyEmailTemplate(null, { url: 'u' }).subject).toMatch(/Verify/i);
    expect(verifyEmailTemplate(undefined, { url: 'u' }).subject).toMatch(/Verify/i);
  });
});

describe('welcomeProTemplate', () => {
  it('returns English welcome', () => {
    const r = welcomeProTemplate('en', { name: 'Fran' });
    expect(r.subject).toMatch(/Pro/);
    expect(r.text).toContain('Hi Fran');
    expect(r.text).toContain('Cloud sync');
  });

  it('returns Spanish welcome', () => {
    const r = welcomeProTemplate('es', { name: 'Fran' });
    expect(r.subject).toMatch(/Pro/);
    expect(r.text).toContain('Hola Fran');
    expect(r.text).toContain('Sincronización en la nube');
  });

  it('handles missing name', () => {
    const r = welcomeProTemplate('en', {});
    expect(r.text.startsWith('Hi,')).toBe(true);
  });
});
