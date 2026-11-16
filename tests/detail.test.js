import { describe, it, expect } from 'vitest';
import { isSizeSelected, buildWhatsAppUrl, formatPrice } from '../src/utils.js';
import { getProductImages } from '../src/main.js';
import productsData from '../src/products.json';

describe('Size Required Logic (Screen 2)', () => {
  it('identifies standard garment sizes as selected', () => {
    expect(isSizeSelected('S')).toBe(true);
    expect(isSizeSelected('M')).toBe(true);
    expect(isSizeSelected('L')).toBe(true);
    expect(isSizeSelected('XL')).toBe(true);
    expect(isSizeSelected('XXL')).toBe(true);
  });

  it('identifies Custom size as selected', () => {
    expect(isSizeSelected('Custom')).toBe(true);
  });

  it('rejects null, undefined, empty, or whitespace-only values', () => {
    expect(isSizeSelected(null)).toBe(false);
    expect(isSizeSelected(undefined)).toBe(false);
    expect(isSizeSelected('')).toBe(false);
    expect(isSizeSelected('   ')).toBe(false);
  });
});

describe('WhatsApp Message with Size & Page Link (Screen 2)', () => {
  it('formats a complete order message with product name, size, price, and URL', () => {
    const url = buildWhatsAppUrl('2347065086445', {
      product: 'Kaftan 010 – Royal Sand',
      size: 'L',
      price: 120000,
      link: 'http://127.0.0.1:4173/#product/kaftan-010'
    });

    expect(url.startsWith('https://wa.me/2347065086445?text=')).toBe(true);
    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);

    expect(decodedMessage).toContain('Kaftan 010 – Royal Sand');
    expect(decodedMessage).toContain('(Size: L)');
    expect(decodedMessage).toContain('for ₦120,000');
    expect(decodedMessage).toContain('Link: http://127.0.0.1:4173/#product/kaftan-010');
  });

  it('handles Custom size measurement request message correctly', () => {
    const url = buildWhatsAppUrl('2347065086445', {
      product: 'Monarch Grand Agbada',
      size: 'Custom',
      price: 250000,
      link: 'https://apparelbyezekiel.ng/#product/agbada-monarch'
    });

    const decodedMessage = decodeURIComponent(url.split('?text=')[1]);
    expect(decodedMessage).toContain('(Size: Custom)');
    expect(decodedMessage).toContain('for ₦250,000');
    expect(decodedMessage).toContain('Link: https://apparelbyezekiel.ng/#product/agbada-monarch');
  });
});

describe('Product Images Backwards Compatibility', () => {
  it('returns images array when present on modern products', () => {
    const modernProduct = {
      id: 'kaftan-test',
      name: 'Test Kaftan',
      images: [
        'https://placehold.co/600x800/e7e5e0/0a0a0a?text=Front',
        'https://placehold.co/600x800/e7e5e0/0a0a0a?text=Back'
      ]
    };

    const imgs = getProductImages(modernProduct);
    expect(imgs).toEqual(modernProduct.images);
    expect(imgs).toHaveLength(2);
  });

  it('falls back to single image property for legacy products', () => {
    const legacyProduct = {
      id: 'legacy-item',
      name: 'Legacy Piece',
      image: 'https://placehold.co/600x800/e7e5e0/0a0a0a?text=Single'
    };

    const imgs = getProductImages(legacyProduct);
    expect(imgs).toEqual([legacyProduct.image]);
  });

  it('returns empty array when neither images nor image is present', () => {
    expect(getProductImages({})).toEqual([]);
    expect(getProductImages(null)).toEqual([]);
  });

  it('verifies all catalog items in products.json have both images array and legacy image field', () => {
    expect(productsData.length).toBeGreaterThan(0);
    for (const item of productsData) {
      expect(Array.isArray(item.images)).toBe(true);
      expect(item.images.length).toBeGreaterThanOrEqual(3);
      expect(item.image).toBe(item.images[0]);
    }
  });
});
