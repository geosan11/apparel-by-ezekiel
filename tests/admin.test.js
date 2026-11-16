import { describe, it, expect } from 'vitest';
import {
  parsePrice,
  formatPrice,
  generateSlug,
  calculateResizeDimensions,
  normalizeProduct,
  loadProductsFallback
} from '../src/utils.js';

describe('Price Parsing & Formatting (Screen 4)', () => {
  it('parses numeric string inputs to integers', () => {
    expect(parsePrice('120000')).toBe(120000);
    expect(parsePrice('85000')).toBe(85000);
    expect(parsePrice(250000)).toBe(250000);
  });

  it('strips Naira symbol, commas, and whitespace', () => {
    expect(parsePrice('₦120,000')).toBe(120000);
    expect(parsePrice(' ₦ 250,000 ')).toBe(250000);
    expect(parsePrice('₦95,500')).toBe(95500);
    expect(parsePrice('$10,000')).toBe(10000);
  });

  it('handles decimal values by rounding to integer Naira', () => {
    expect(parsePrice('120000.50')).toBe(120001);
    expect(parsePrice('120000.20')).toBe(120000);
  });

  it('safely falls back to 0 for invalid, empty, or negative amounts', () => {
    expect(parsePrice('')).toBe(0);
    expect(parsePrice(null)).toBe(0);
    expect(parsePrice(undefined)).toBe(0);
    expect(parsePrice('invalid')).toBe(0);
    expect(parsePrice(-500)).toBe(0);
  });

  it('formats parsed prices consistently with formatPrice', () => {
    const raw = ' ₦ 180,000 ';
    const parsed = parsePrice(raw);
    expect(parsed).toBe(180000);
    expect(formatPrice(parsed)).toBe('₦180,000');
  });
});

describe('Slug Generation (Screen 4)', () => {
  it('converts product name into lowercase kebab-case slug', () => {
    expect(generateSlug('Kaftan 010 – Royal Sand')).toBe('kaftan-010-royal-sand');
    expect(generateSlug('Monarch Grand Agbada')).toBe('monarch-grand-agbada');
    expect(generateSlug('Diplomat Senator – Slate Grey')).toBe('diplomat-senator-slate-grey');
  });

  it('handles special characters, punctuation, and multiple spaces', () => {
    expect(generateSlug('Ezekiel\'s Luxury Agbada & Co.')).toBe('ezekiel-s-luxury-agbada-co');
    expect(generateSlug('Royal Fila Cap: Onyx / Silver #1!')).toBe('royal-fila-cap-onyx-silver-1');
  });

  it('removes accented characters and diacritics', () => {
    expect(generateSlug('Café Agbada Élégance')).toBe('cafe-agbada-elegance');
  });

  it('provides safe fallback for empty or non-string inputs', () => {
    expect(generateSlug('')).toBe('garment');
    expect(generateSlug('   ')).toBe('garment');
    expect(generateSlug('---')).toBe('garment');
    expect(generateSlug(null)).toBe('garment');
    expect(generateSlug(undefined)).toBe('garment');
  });
});

describe('Image Resize Dimension Calculation (Screen 4)', () => {
  it('maintains original dimensions if image is already within maxDimension (1600px)', () => {
    const dim1 = calculateResizeDimensions(1200, 800, 1600);
    expect(dim1).toEqual({ width: 1200, height: 800 });

    const dim2 = calculateResizeDimensions(800, 1200, 1600);
    expect(dim2).toEqual({ width: 800, height: 1200 });

    const dim3 = calculateResizeDimensions(1600, 1600, 1600);
    expect(dim3).toEqual({ width: 1600, height: 1600 });
  });

  it('scales down wide landscape images so width equals 1600 while maintaining aspect ratio', () => {
    // 3200 x 2400 (4:3 aspect ratio) -> 1600 x 1200
    const dim = calculateResizeDimensions(3200, 2400, 1600);
    expect(dim).toEqual({ width: 1600, height: 1200 });
  });

  it('scales down tall portrait images so height equals 1600 while maintaining aspect ratio', () => {
    // 1800 x 3600 (1:2 aspect ratio) -> 800 x 1600
    const dim = calculateResizeDimensions(1800, 3600, 1600);
    expect(dim).toEqual({ width: 800, height: 1600 });
  });

  it('scales large square images accurately', () => {
    const dim = calculateResizeDimensions(3000, 3000, 1600);
    expect(dim).toEqual({ width: 1600, height: 1600 });
  });

  it('safely handles zero, negative, or invalid dimensions', () => {
    expect(calculateResizeDimensions(0, 0)).toEqual({ width: 0, height: 0 });
    expect(calculateResizeDimensions(-100, 500)).toEqual({ width: 0, height: 0 });
    expect(calculateResizeDimensions(null, undefined)).toEqual({ width: 0, height: 0 });
  });
});

describe('Product Fallback Logic (Screen 4)', () => {
  const sampleFallbackProducts = [
    {
      id: 'kaftan-010',
      name: 'Kaftan 010 – Royal Sand',
      category: 'Kaftans',
      price: 120000,
      description: 'Handcrafted Irish wool kaftan',
      details: 'Tailored trousers included',
      image: 'https://placehold.co/600x800?text=Front',
      images: [
        'https://placehold.co/600x800?text=Front',
        'https://placehold.co/600x800?text=Detail'
      ]
    },
    {
      id: 'agbada-monarch',
      name: 'Monarch Grand Agbada',
      category: 'Agbada',
      price: 250000,
      description: 'Grand Aso-Oke piece',
      image: 'https://placehold.co/600x800?text=Agbada'
    }
  ];

  it('uses API products when Supabase returns valid records', () => {
    const apiProducts = [
      {
        id: 'supabase-uuid-1',
        slug: 'kaftan-emerald-lux',
        name: 'Kaftan Emerald Lux',
        category: 'Kaftans',
        price: 135000,
        description: 'New emerald piece from database',
        details: 'Handstitched collar',
        sizes: ['M', 'L', 'XL'],
        images: ['https://cdn.supabase.co/img1.webp'],
        is_published: true,
        sort_order: 1
      }
    ];

    const result = loadProductsFallback(apiProducts, sampleFallbackProducts);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('supabase-uuid-1');
    expect(result[0].slug).toBe('kaftan-emerald-lux');
    expect(result[0].name).toBe('Kaftan Emerald Lux');
    expect(result[0].price).toBe(135000);
  });

  it('falls back to local products when API products are empty, null, or undefined', () => {
    // Empty array from Supabase
    const emptyResult = loadProductsFallback([], sampleFallbackProducts);
    expect(emptyResult).toHaveLength(2);
    expect(emptyResult[0].id).toBe('kaftan-010');

    // Null from API failure
    const nullResult = loadProductsFallback(null, sampleFallbackProducts);
    expect(nullResult).toHaveLength(2);
    expect(nullResult[0].name).toBe('Kaftan 010 – Royal Sand');

    // Undefined
    const undefResult = loadProductsFallback(undefined, sampleFallbackProducts);
    expect(undefResult).toHaveLength(2);
  });

  it('normalizes legacy products that only have a single image property', () => {
    const legacyItem = {
      id: 'single-img-product',
      name: 'Single Image Garment',
      category: 'Accessories',
      price: 45000,
      image: 'https://placehold.co/600x800?text=Accessory'
    };

    const normalized = normalizeProduct(legacyItem);
    expect(normalized.images).toEqual(['https://placehold.co/600x800?text=Accessory']);
    expect(normalized.image).toBe('https://placehold.co/600x800?text=Accessory');
    expect(normalized.sizes).toEqual(['S', 'M', 'L', 'XL', 'XXL', 'Custom']);
    expect(normalized.is_published).toBe(true);
  });

  it('normalizes missing fields with appropriate defaults', () => {
    const sparse = {
      slug: 'minimal-product'
    };

    const normalized = normalizeProduct(sparse);
    expect(normalized.name).toBe('Untitled Garment');
    expect(normalized.category).toBe('Kaftans');
    expect(normalized.price).toBe(0);
    expect(normalized.description).toBe('');
    expect(normalized.sizes).toHaveLength(6);
    expect(normalized.images).toEqual([]);
  });
});
