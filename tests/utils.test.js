import { describe, it, expect } from 'vitest';
import { formatPrice, buildWhatsAppUrl, filterProducts, escapeHtml } from '../src/utils.js';

describe('formatPrice', () => {
  it('formats whole numbers to Nigerian Naira format', () => {
    expect(formatPrice(120000)).toBe('₦120,000');
    expect(formatPrice(85000)).toBe('₦85,000');
    expect(formatPrice(250000)).toBe('₦250,000');
  });

  it('handles string numbers gracefully', () => {
    expect(formatPrice('120000')).toBe('₦120,000');
  });

  it('handles invalid or zero inputs', () => {
    expect(formatPrice(0)).toBe('₦0');
    expect(formatPrice('abc')).toBe('₦0');
  });
});

describe('buildWhatsAppUrl', () => {
  it('builds a direct wa.me link with product, size and formatted price', () => {
    const url = buildWhatsAppUrl('2347065086445', {
      product: 'Kaftan 010 – Royal Sand',
      size: 'L',
      price: 120000
    });

    expect(url).toContain('https://wa.me/2347065086445?text=');
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);
    expect(decodedMessage).toBe(
      'Hello Apparel by Ezekiel, I want to order the Kaftan 010 – Royal Sand (Size: L) for ₦120,000.'
    );
  });

  it('cleans non-digits from phone number', () => {
    const url = buildWhatsAppUrl('+234-706-508-6445', {
      product: 'Senator Diplomat',
      size: 'XL',
      price: 95000
    });
    expect(url.startsWith('https://wa.me/2347065086445')).toBe(true);
  });
});

describe('filterProducts', () => {
  const sampleProducts = [
    {
      id: 'kaftan-1',
      name: 'Kaftan 010',
      category: 'Kaftans',
      price: 120000,
      description: 'Handcrafted Irish wool kaftan'
    },
    {
      id: 'agbada-1',
      name: 'Monarch Agbada',
      category: 'Agbada',
      price: 250000,
      description: 'Grand Aso-Oke three piece agbada'
    },
    {
      id: 'senator-1',
      name: 'Diplomat Senator',
      category: 'Senator',
      price: 95000,
      description: 'Slate grey executive senator'
    }
  ];

  it('returns all products when category is "All" and search is empty', () => {
    const res = filterProducts(sampleProducts, { category: 'All', search: '' });
    expect(res).toHaveLength(3);
  });

  it('filters by category accurately', () => {
    const kaftans = filterProducts(sampleProducts, { category: 'Kaftans' });
    expect(kaftans).toHaveLength(1);
    expect(kaftans[0].id).toBe('kaftan-1');

    const agbada = filterProducts(sampleProducts, { category: 'Agbada' });
    expect(agbada).toHaveLength(1);
    expect(agbada[0].id).toBe('agbada-1');
  });

  it('filters by search keyword matching name or description', () => {
    const res = filterProducts(sampleProducts, { search: 'monarch' });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe('agbada-1');

    const descRes = filterProducts(sampleProducts, { search: 'executive' });
    expect(descRes).toHaveLength(1);
    expect(descRes[0].id).toBe('senator-1');
  });

  it('combines category and search filters', () => {
    const res = filterProducts(sampleProducts, { category: 'Kaftans', search: 'agbada' });
    expect(res).toHaveLength(0);

    const match = filterProducts(sampleProducts, { category: 'Kaftans', search: 'irish' });
    expect(match).toHaveLength(1);
    expect(match[0].id).toBe('kaftan-1');
  });
});

describe('escapeHtml', () => {
  it('escapes dangerous HTML characters', () => {
    const malicious = '<script>alert("xss")</script>&"\'';
    const clean = escapeHtml(malicious);
    expect(clean).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;&#039;');
  });

  it('handles null and undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });
});
