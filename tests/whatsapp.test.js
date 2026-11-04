import { describe, it, expect } from 'vitest';
import {
  DEFAULT_WHATSAPP_PHONE,
  getWhatsAppPhone,
  normalizeWhatsAppPhone,
  buildWhatsAppUrl,
  buildBookingMessage
} from '../src/utils/whatsapp.js';

describe('whatsapp utility', () => {
  it('default phone is 2347065086445', () => {
    expect(DEFAULT_WHATSAPP_PHONE).toBe('2347065086445');
    expect(getWhatsAppPhone()).toBe('2347065086445');
  });

  it('normalizes local Nigerian phone starting with 0', () => {
    expect(normalizeWhatsAppPhone('07065086445')).toBe('2347065086445');
  });

  it('normalizes phone with + and spaces', () => {
    expect(normalizeWhatsAppPhone('+234 706 508 6445')).toBe('2347065086445');
  });

  it('builds WhatsApp URL with empty message', () => {
    expect(buildWhatsAppUrl('')).toBe('https://wa.me/2347065086445');
  });

  it('properly encodes message containing newline, & and emoji', () => {
    const message = 'Hello & welcome!\nNew collection 🎉';
    const url = buildWhatsAppUrl(message);
    expect(url).toBe(`https://wa.me/2347065086445?text=${encodeURIComponent(message)}`);
    expect(url).toContain('%26');
    expect(url).toContain('%0A');
    expect(url).toContain('%F0%9F%8E%89');
  });

  it('builds booking message including name, phone, date, design, ref and omits Notes line when empty', () => {
    const msgWithoutNotes = buildBookingMessage({
      name: 'Adeyemi Johnson',
      phone: '08012345678',
      date: '2026-12-15',
      designTitle: 'Imperial Agbada Set',
      ref: 'BK-10023'
    });

    expect(msgWithoutNotes).toContain('Hello Ezekiel, I just booked a bespoke fitting on your website:');
    expect(msgWithoutNotes).toContain('Name: Adeyemi Johnson');
    expect(msgWithoutNotes).toContain('Phone: 08012345678');
    expect(msgWithoutNotes).toContain('Preferred fitting date: 2026-12-15');
    expect(msgWithoutNotes).toContain('Design: Imperial Agbada Set');
    expect(msgWithoutNotes).toContain('Booking ref: BK-10023');
    expect(msgWithoutNotes).toContain('Please confirm my fitting and the deposit details.');
    expect(msgWithoutNotes).not.toContain('Notes:');

    // Default design title
    const msgDefaultDesign = buildBookingMessage({
      name: 'Adeyemi Johnson',
      phone: '08012345678',
      date: '2026-12-15',
      ref: 'BK-10024'
    });
    expect(msgDefaultDesign).toContain('Design: Bespoke Consultation');

    // With notes
    const msgWithNotes = buildBookingMessage({
      name: 'Adeyemi Johnson',
      phone: '08012345678',
      date: '2026-12-15',
      designTitle: 'Senator Suit',
      ref: 'BK-10025',
      notes: 'Prefers deep navy blue fabric'
    });
    expect(msgWithNotes).toContain('Notes: Prefers deep navy blue fabric');
  });

  it('ensures no URL contains 2348000000000', () => {
    const urlDefault = buildWhatsAppUrl('');
    const urlMsg = buildWhatsAppUrl('Test message');
    const msg = buildBookingMessage({
      name: 'John',
      phone: '08012345678',
      date: '2026-12-15',
      ref: 'BK-1'
    });
    const urlBooking = buildWhatsAppUrl(msg);

    const oldPlaceholder = '2348' + '000000000';
    expect(urlDefault).not.toContain(oldPlaceholder);
    expect(urlMsg).not.toContain(oldPlaceholder);
    expect(urlBooking).not.toContain(oldPlaceholder);
  });
});
