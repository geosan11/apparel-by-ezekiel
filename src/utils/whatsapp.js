export const DEFAULT_WHATSAPP_PHONE = '2347065086445';
const OLD_PLACEHOLDER_PHONE = '2348' + '000000000';

/**
 * Returns digits-only of import.meta.env?.VITE_WHATSAPP_PHONE,
 * falling back to DEFAULT_WHATSAPP_PHONE when empty or equal to the old placeholder.
 */
export function getWhatsAppPhone() {
  let raw = '';
  try {
    if (typeof import.meta !== 'undefined' && import.meta && import.meta.env) {
      raw = (import.meta.env.VITE_WHATSAPP_PHONE || '').trim();
    }
  } catch {
    raw = '';
  }
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits === OLD_PLACEHOLDER_PHONE) {
    return DEFAULT_WHATSAPP_PHONE;
  }
  return digits;
}

/**
 * Normalizes WhatsApp phone number string to digits.
 * If 11 digits starting with '0', replaces leading '0' with '234'.
 */
export function normalizeWhatsAppPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    return '234' + digits.slice(1);
  }
  return digits;
}

/**
 * Builds a WhatsApp wa.me URL with optional pre-filled message.
 */
export function buildWhatsAppUrl(message = '', phone = getWhatsAppPhone()) {
  const normalized = normalizeWhatsAppPhone(phone);
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

/**
 * Formats a multi-line booking inquiry message for WhatsApp.
 */
export function buildBookingMessage({
  name = '',
  phone = '',
  date = '',
  designTitle = '',
  ref = '',
  notes = ''
} = {}) {
  const lines = [
    'Hello Ezekiel, I just booked a bespoke fitting on your website:',
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Preferred fitting date: ${date}`,
    `Design: ${designTitle || 'Bespoke Consultation'}`
  ];

  if (notes && String(notes).trim()) {
    lines.push(`Notes: ${notes}`);
  }

  lines.push(`Booking ref: ${ref}`);
  lines.push('Please confirm my fitting and the deposit details.');

  return lines.join('\n');
}
