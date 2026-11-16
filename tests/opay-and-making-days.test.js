import { describe, it, expect } from 'vitest';
import {
  nairaToKobo,
  koboToNaira,
  validateMakingDays,
  calculateExpectedReadyDate,
  formatExpectedReadyDate,
  sortObjectKeys,
  generateOpaySignature,
  verifyOpaySignature,
  normalizeProduct
} from '../src/utils.js';
import productsFallback from '../src/products.json';

describe('Price and Kobo conversion', () => {
  it('converts Naira numbers to Kobo integers (1 Naira = 100 Kobo)', () => {
    expect(nairaToKobo(120000)).toBe(12000000);
    expect(nairaToKobo(85000)).toBe(8500000);
    expect(nairaToKobo(250000)).toBe(25000000);
    expect(nairaToKobo(95000)).toBe(9500000);
  });

  it('converts formatted string Naira inputs to Kobo integers', () => {
    expect(nairaToKobo('120000')).toBe(12000000);
    expect(nairaToKobo('₦120,000')).toBe(12000000);
    expect(nairaToKobo('₦250,000.00')).toBe(25000000);
  });

  it('handles zero, negative, null and invalid inputs gracefully', () => {
    expect(nairaToKobo(0)).toBe(0);
    expect(nairaToKobo(-1000)).toBe(0);
    expect(nairaToKobo(null)).toBe(0);
    expect(nairaToKobo(undefined)).toBe(0);
    expect(nairaToKobo('invalid')).toBe(0);
  });

  it('converts Kobo to Naira correctly', () => {
    expect(koboToNaira(12000000)).toBe(120000);
    expect(koboToNaira(8500000)).toBe(85000);
    expect(koboToNaira(25000000)).toBe(250000);
    expect(koboToNaira(0)).toBe(0);
    expect(koboToNaira(null)).toBe(0);
  });

  it('round-trips Naira through Kobo conversion without loss', () => {
    const prices = [85000, 95000, 105000, 110000, 120000, 220000, 250000];
    prices.forEach((price) => {
      expect(koboToNaira(nairaToKobo(price))).toBe(price);
    });
  });
});

describe('Making days turnaround validation & expected ready date', () => {
  it('validates making_days within the 1-90 days boundary', () => {
    expect(validateMakingDays(1)).toEqual({ valid: true, value: 1 });
    expect(validateMakingDays(14)).toEqual({ valid: true, value: 14 });
    expect(validateMakingDays(90)).toEqual({ valid: true, value: 90 });
    expect(validateMakingDays('21')).toEqual({ valid: true, value: 21 });
  });

  it('permits null and empty values (representing optional turnaround)', () => {
    expect(validateMakingDays(null)).toEqual({ valid: true, value: null });
    expect(validateMakingDays(undefined)).toEqual({ valid: true, value: null });
    expect(validateMakingDays('')).toEqual({ valid: true, value: null });
    expect(validateMakingDays('   ')).toEqual({ valid: true, value: null });
  });

  it('rejects numbers outside the 1-90 range or non-integers', () => {
    expect(validateMakingDays(0).valid).toBe(false);
    expect(validateMakingDays(-5).valid).toBe(false);
    expect(validateMakingDays(91).valid).toBe(false);
    expect(validateMakingDays(100).valid).toBe(false);
    expect(validateMakingDays(7.5).valid).toBe(false);
    expect(validateMakingDays('two weeks').valid).toBe(false);
  });

  it('calculates expected ready date by adding making_days to start date', () => {
    const startDate = new Date('2026-11-16T12:00:00Z');
    const readyDateStr = calculateExpectedReadyDate(startDate, 10);
    expect(readyDateStr).toBe('2026-11-26');

    // Over month boundary
    const nearMonthEnd = new Date('2026-11-25T12:00:00Z');
    expect(calculateExpectedReadyDate(nearMonthEnd, 10)).toBe('2026-12-05');
  });

  it('returns null for expected ready date when making_days is missing or invalid', () => {
    const startDate = new Date('2026-11-16');
    expect(calculateExpectedReadyDate(startDate, null)).toBeNull();
    expect(calculateExpectedReadyDate(startDate, 0)).toBeNull();
    expect(calculateExpectedReadyDate(startDate, -4)).toBeNull();
    expect(calculateExpectedReadyDate('invalid-date-string', 10)).toBeNull();
  });

  it('formats expected ready date in readable form', () => {
    const formatted = formatExpectedReadyDate('2026-11-26');
    expect(formatted).toContain('2026');
    expect(formatted).toContain('Nov');
    expect(formatted).toContain('26');
  });
});

describe('OPay HMAC-SHA512 signature helper', () => {
  const secretKey = 'OPAY_TEST_SECRET_KEY_987654321';

  it('sorts object keys alphabetically and recursively', () => {
    const unsorted = {
      z: 1,
      a: {
        d: 4,
        b: 2
      },
      m: [ { y: 25, x: 24 } ]
    };
    const sorted = sortObjectKeys(unsorted);
    expect(Object.keys(sorted)).toEqual(['a', 'm', 'z']);
    expect(Object.keys(sorted.a)).toEqual(['b', 'd']);
    expect(Object.keys(sorted.m[0])).toEqual(['x', 'y']);
  });

  it('generates a 128-character hex HMAC-SHA512 hash', async () => {
    const payload = { reference: 'ABE-12345', country: 'NG' };
    const sig = await generateOpaySignature(payload, secretKey);
    expect(typeof sig).toBe('string');
    expect(sig.length).toBe(128); // 512 bits / 4 = 128 hex characters
    expect(/^[0-9a-f]{128}$/.test(sig)).toBe(true);
  });

  it('is deterministic: same payload and key produce identical signatures', async () => {
    const payload1 = { reference: 'ABE-12345', country: 'NG' };
    const payload2 = { country: 'NG', reference: 'ABE-12345' }; // different key insertion order
    const sig1 = await generateOpaySignature(payload1, secretKey);
    const sig2 = await generateOpaySignature(payload2, secretKey);
    expect(sig1).toBe(sig2);
  });

  it('produces different signatures for different payloads or keys', async () => {
    const sigA = await generateOpaySignature({ reference: 'REF-A' }, secretKey);
    const sigB = await generateOpaySignature({ reference: 'REF-B' }, secretKey);
    const sigC = await generateOpaySignature({ reference: 'REF-A' }, 'DIFFERENT_KEY');
    expect(sigA).not.toBe(sigB);
    expect(sigA).not.toBe(sigC);
  });

  it('verifies valid signatures in verifyOpaySignature', async () => {
    const payload = { reference: 'ABE-7890', amount: { total: 12000000, currency: 'NGN' } };
    const sig = await generateOpaySignature(payload, secretKey);

    const isValid = await verifyOpaySignature(payload, sig, secretKey);
    expect(isValid).toBe(true);

    // Also supports Bearer prefix and uppercase hex
    const withBearer = await verifyOpaySignature(payload, `Bearer ${sig.toUpperCase()}`, secretKey);
    expect(withBearer).toBe(true);
  });

  it('rejects tampered signatures or modified bodies in verifyOpaySignature', async () => {
    const payload = { reference: 'ABE-7890', amount: { total: 12000000 } };
    const sig = await generateOpaySignature(payload, secretKey);

    // Modified body
    const tamperedPayload = { reference: 'ABE-7890', amount: { total: 500 } };
    const checkTampered = await verifyOpaySignature(tamperedPayload, sig, secretKey);
    expect(checkTampered).toBe(false);

    // Modified signature
    const badSig = sig.substring(0, 127) + (sig[127] === 'a' ? 'b' : 'a');
    const checkBadSig = await verifyOpaySignature(payload, badSig, secretKey);
    expect(checkBadSig).toBe(false);

    // Wrong secret key
    const checkWrongKey = await verifyOpaySignature(payload, sig, 'WRONG_KEY');
    expect(checkWrongKey).toBe(false);

    // Empty parameters
    expect(await verifyOpaySignature(payload, '', secretKey)).toBe(false);
    expect(await verifyOpaySignature(payload, sig, '')).toBe(false);
  });
});

describe('Product fallback making_days configuration', () => {
  it('each product in products.json fallback has making_days between 7 and 21', () => {
    expect(productsFallback.length).toBeGreaterThan(0);
    productsFallback.forEach((p) => {
      expect(p.making_days).toBeDefined();
      expect(typeof p.making_days).toBe('number');
      expect(p.making_days).toBeGreaterThanOrEqual(7);
      expect(p.making_days).toBeLessThanOrEqual(21);
    });
  });

  it('normalizeProduct correctly preserves making_days', () => {
    const raw = {
      id: 'kaftan-test',
      name: 'Test Kaftan',
      category: 'Kaftans',
      price: 120000,
      making_days: 14
    };
    const normalized = normalizeProduct(raw);
    expect(normalized.making_days).toBe(14);
  });

  it('normalizeProduct sanitizes invalid making_days to null', () => {
    const rawInvalid = {
      id: 'kaftan-test-invalid',
      name: 'Test Kaftan',
      price: 120000,
      making_days: 150 // exceeds 90
    };
    const normalized = normalizeProduct(rawInvalid);
    expect(normalized.making_days).toBeNull();
  });
});
