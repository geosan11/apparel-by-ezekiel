import { describe, it, expect } from 'vitest';
import {
  parseAmount,
  parseCategory,
  parseDate,
  parseExpenseText,
  formatDateISO
} from '../src/admin/expenseParser.js';

describe('Expense Parser - Amounts', () => {
  it('parses 18k and 18K correctly as 18,000', () => {
    expect(parseAmount('18k')?.value).toBe(18000);
    expect(parseAmount('18K')?.value).toBe(18000);
    expect(parseAmount('bought fabric 18k')?.value).toBe(18000);
  });

  it('parses 18,000 with commas correctly', () => {
    expect(parseAmount('18,000')?.value).toBe(18000);
    expect(parseAmount('Spent 18,000 on thread')?.value).toBe(18000);
  });

  it('parses ₦18000 with Naira symbol', () => {
    expect(parseAmount('₦18000')?.value).toBe(18000);
    expect(parseAmount('Paid ₦18,000 yesterday')?.value).toBe(18000);
  });

  it('parses N18000 with N prefix', () => {
    expect(parseAmount('N18000')?.value).toBe(18000);
    expect(parseAmount('N18000 fuel last friday')?.value).toBe(18000);
    expect(parseAmount('N18,000')?.value).toBe(18000);
  });

  it('parses 1.5m and 1.5M correctly as 1,500,000', () => {
    expect(parseAmount('1.5m')?.value).toBe(1500000);
    expect(parseAmount('1.5M')?.value).toBe(1500000);
    expect(parseAmount('1.5m rent for atelier')?.value).toBe(1500000);
    expect(parseAmount('₦1.5m')?.value).toBe(1500000);
  });

  it('parses decimal k amounts like 2.5k as 2,500', () => {
    expect(parseAmount('2.5k')?.value).toBe(2500);
  });

  it('parses raw plain numbers like 4500', () => {
    expect(parseAmount('transport 4500')?.value).toBe(4500);
  });
});

describe('Expense Parser - Categories', () => {
  it('maps fabric keywords accurately', () => {
    expect(parseCategory('Bought 10 yards of damask')).toBe('fabric');
    expect(parseCategory('Swiss cotton material')).toBe('fabric');
    expect(parseCategory('velvet cloth for kaftan')).toBe('fabric');
    expect(parseCategory('lining and wool')).toBe('fabric');
  });

  it('maps thread & trims keywords', () => {
    expect(parseCategory('golden buttons and thread')).toBe('thread');
    expect(parseCategory('zippers and collar stay')).toBe('thread');
  });

  it('maps transport keywords', () => {
    expect(parseCategory('Uber to fabric market')).toBe('transport');
    expect(parseCategory('bolt fare')).toBe('transport');
    expect(parseCategory('okada ride to balogun')).toBe('transport');
  });

  it('maps logistics keywords', () => {
    expect(parseCategory('dispatch rider delivery to Victoria Island')).toBe('logistics');
    expect(parseCategory('waybill to Abuja')).toBe('logistics');
    expect(parseCategory('DHL shipping')).toBe('logistics');
  });

  it('maps staff keywords', () => {
    expect(parseCategory('paid tailor apprentice wage')).toBe('staff');
    expect(parseCategory('weekly sewing labor')).toBe('staff');
    expect(parseCategory('ironing guy payment')).toBe('staff');
  });

  it('maps rent keywords', () => {
    expect(parseCategory('atelier rent payment')).toBe('rent');
    expect(parseCategory('showroom service charge')).toBe('rent');
  });

  it('maps power/fuel keywords', () => {
    expect(parseCategory('diesel for generator')).toBe('power/fuel');
    expect(parseCategory('NEPA electricity bill')).toBe('power/fuel');
    expect(parseCategory('gen fuel')).toBe('power/fuel');
  });

  it('maps marketing keywords', () => {
    expect(parseCategory('Instagram ad campaign')).toBe('marketing');
    expect(parseCategory('model lookbook photoshoot')).toBe('marketing');
  });

  it('maps packaging keywords', () => {
    expect(parseCategory('custom garment bags and boxes')).toBe('packaging');
    expect(parseCategory('wooden suit hangers')).toBe('packaging');
    expect(parseCategory('woven neck labels')).toBe('packaging');
  });

  it('defaults to other when unknown', () => {
    expect(parseCategory('bought fresh drinking water for office')).toBe('other');
    expect(parseCategory('random repair 5000')).toBe('other');
  });
});

describe('Expense Parser - Dates', () => {
  // Tuesday, Nov 3, 2026
  const refDate = new Date(2026, 10, 3); // Month is 0-indexed: 10 = November

  it('parses today', () => {
    const res = parseDate('paid 10k today', refDate);
    expect(res.date).toBe('2026-11-03');
  });

  it('parses yesterday', () => {
    const res = parseDate('bought buttons yesterday', refDate);
    expect(res.date).toBe('2026-11-02');
  });

  it('parses last <weekday> (e.g. last friday from Tuesday Nov 3, 2026)', () => {
    // If refDate is Tuesday Nov 3, 2026:
    // Last Friday was Oct 30, 2026
    const res = parseDate('N18000 fuel last friday', refDate);
    expect(res.date).toBe('2026-10-30');
  });

  it('parses last monday from Tuesday Nov 3, 2026', () => {
    // Last Monday was Nov 2, 2026
    const res = parseDate('dispatch 2500 last monday', refDate);
    expect(res.date).toBe('2026-11-02');
  });

  it('parses explicit ISO date YYYY-MM-DD', () => {
    const res = parseDate('1.5m rent 2026-11-01', refDate);
    expect(res.date).toBe('2026-11-01');
  });
});

describe('Expense Parser - Full Sentence parseExpenseText', () => {
  const refDate = new Date(2026, 10, 3); // Tuesday Nov 3, 2026

  it('handles "Paid 18k for fabric today"', () => {
    const result = parseExpenseText('Paid 18k for fabric today', refDate);
    expect(result).not.toBeNull();
    expect(result.amount).toBe(18000);
    expect(result.formattedAmount).toBe('₦18,000');
    expect(result.category).toBe('fabric');
    expect(result.date).toBe('2026-11-03');
  });

  it('handles "Bought thread ₦18000 yesterday"', () => {
    const result = parseExpenseText('Bought thread ₦18000 yesterday', refDate);
    expect(result).not.toBeNull();
    expect(result.amount).toBe(18000);
    expect(result.category).toBe('thread');
    expect(result.date).toBe('2026-11-02');
  });

  it('handles "N18000 fuel last friday"', () => {
    const result = parseExpenseText('N18000 fuel last friday', refDate);
    expect(result).not.toBeNull();
    expect(result.amount).toBe(18000);
    expect(result.category).toBe('power/fuel');
    expect(result.date).toBe('2026-10-30');
  });

  it('handles "1.5m rent 2026-11-01"', () => {
    const result = parseExpenseText('1.5m rent 2026-11-01', refDate);
    expect(result).not.toBeNull();
    expect(result.amount).toBe(1500000);
    expect(result.category).toBe('rent');
    expect(result.date).toBe('2026-11-01');
  });

  it('handles "Dispatch rider 2,500"', () => {
    const result = parseExpenseText('Dispatch rider 2,500', refDate);
    expect(result).not.toBeNull();
    expect(result.amount).toBe(2500);
    expect(result.category).toBe('logistics');
    expect(result.date).toBe('2026-11-03');
  });

  it('returns null on invalid input or zero amount', () => {
    expect(parseExpenseText('')).toBeNull();
    expect(parseExpenseText('hello world')).toBeNull();
    expect(parseExpenseText(null)).toBeNull();
  });
});
