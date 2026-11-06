import { describe, it, expect } from 'vitest';
import { escapeHtml } from '../src/utils/escapeHtml.js';

describe('escapeHtml utility', () => {
  it('escapes &, <, >, ", and \'', () => {
    expect(escapeHtml('&')).toBe('&amp;');
    expect(escapeHtml('<')).toBe('&lt;');
    expect(escapeHtml('>')).toBe('&gt;');
    expect(escapeHtml('"')).toBe('&quot;');
    expect(escapeHtml("'")).toBe('&#039;');
    expect(escapeHtml('<script>alert("xss & \'attack\'")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss &amp; &#039;attack&#039;&quot;)&lt;/script&gt;'
    );
  });

  it('converts null and undefined to empty string', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(escapeHtml(0)).toBe('0');
    expect(escapeHtml(42)).toBe('42');
    expect(escapeHtml(12345.67)).toBe('12345.67');
  });

  it('ensures an <img src=x onerror=alert(1)> payload contains no "<img"', () => {
    const payload = '<img src=x onerror=alert(1)>';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<img');
    expect(escaped).toBe('&lt;img src=x onerror=alert(1)&gt;');
  });
});
