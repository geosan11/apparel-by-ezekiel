/**
 * Format a number as Nigerian Naira (e.g. 120000 -> ₦120,000)
 * @param {number|string} amount
 * @returns {string}
 */
export function formatPrice(amount) {
  const num = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(num)) return '₦0';
  return `₦${Math.round(num).toLocaleString('en-US')}`;
}

/**
 * Build WhatsApp order link with prefilled order details
 * @param {string} phone e.g. "2347065086445"
 * @param {{ product: string, size?: string, price?: number|string, link?: string }} details
 * @returns {string}
 */
export function buildWhatsAppUrl(
  phone = '2347065086445',
  { product, size = 'M', price, link } = {}
) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const priceText = price != null ? formatPrice(price) : '';
  const parts = [`Hello Apparel by Ezekiel, I want to order the ${product || 'garment'}`];
  if (size) {
    parts.push(`(Size: ${size})`);
  }
  if (priceText) {
    parts.push(`for ${priceText}`);
  }
  let message = `${parts.join(' ')}.`;
  if (link) {
    message += ` Link: ${link}`;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Validate that a size is selected
 * @param {string|null|undefined} size
 * @returns {boolean}
 */
export function isSizeSelected(size) {
  return typeof size === 'string' && size.trim().length > 0;
}

/**
 * Safely extract images array from product, with backwards compatibility
 * for legacy products with a single `image` string.
 * @param {object} product
 * @returns {string[]}
 */
export function getProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images;
  }
  if (product?.image) {
    return [product.image];
  }
  return [];
}

/**
 * Filter product array by category and search keyword
 * @param {Array} products
 * @param {{ category?: string, search?: string }} filters
 * @returns {Array}
 */
export function filterProducts(products = [], { category = 'All', search = '' } = {}) {
  const q = (search || '').trim().toLowerCase();
  const cat = (category || 'All').trim();

  return products.filter((p) => {
    const matchesCategory =
      !cat || cat === 'All' || p.category.toLowerCase() === cat.toLowerCase();

    if (!matchesCategory) return false;
    if (!q) return true;

    const nameMatch = (p.name || '').toLowerCase().includes(q);
    const catMatch = (p.category || '').toLowerCase().includes(q);
    const descMatch = (p.description || '').toLowerCase().includes(q);

    return nameMatch || catMatch || descMatch;
  });
}

/**
 * Escape HTML characters to prevent XSS injection
 * @param {*} str
 * @returns {string}
 */
export function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Measurement field definitions and validation boundaries
 */
export const MEASUREMENT_CONFIG = {
  chest: {
    id: 'chest',
    step: 1,
    label: 'Chest',
    tip: 'Around the fullest part of your chest, tape held flat and horizontal.',
    optional: false,
    placeholders: { in: '40', cm: '102' },
    ranges: {
      in: { min: 28, max: 65 },
      cm: { min: 71, max: 165 }
    }
  },
  shoulder: {
    id: 'shoulder',
    step: 1,
    label: 'Shoulder Width',
    tip: 'Across your back from the tip of one shoulder bone to the other.',
    optional: false,
    placeholders: { in: '19', cm: '48' },
    ranges: {
      in: { min: 14, max: 28 },
      cm: { min: 35, max: 71 }
    }
  },
  sleeve: {
    id: 'sleeve',
    step: 1,
    label: 'Sleeve Length',
    tip: 'From shoulder bone tip down along arm to wrist bone.',
    optional: false,
    placeholders: { in: '25', cm: '64' },
    ranges: {
      in: { min: 18, max: 38 },
      cm: { min: 45, max: 96 }
    }
  },
  neck: {
    id: 'neck',
    step: 1,
    label: 'Neck',
    tip: 'Around the base of the neck where a shirt collar comfortably rests.',
    optional: false,
    placeholders: { in: '16', cm: '41' },
    ranges: {
      in: { min: 12, max: 24 },
      cm: { min: 30, max: 61 }
    }
  },
  waist: {
    id: 'waist',
    step: 2,
    label: 'Waist',
    tip: 'Around natural waistline just above navel, relaxed breathing.',
    optional: false,
    placeholders: { in: '34', cm: '86' },
    ranges: {
      in: { min: 24, max: 65 },
      cm: { min: 61, max: 165 }
    }
  },
  hip: {
    id: 'hip',
    step: 2,
    label: 'Hip',
    tip: 'Around the fullest part of hips and buttocks with feet together.',
    optional: false,
    placeholders: { in: '40', cm: '102' },
    ranges: {
      in: { min: 28, max: 70 },
      cm: { min: 71, max: 178 }
    }
  },
  trouserLength: {
    id: 'trouserLength',
    step: 2,
    label: 'Trouser Length',
    tip: 'From waistband down outside leg to ankle or preferred shoe hem.',
    optional: false,
    placeholders: { in: '41', cm: '104' },
    ranges: {
      in: { min: 30, max: 52 },
      cm: { min: 76, max: 132 }
    }
  },
  kaftanLength: {
    id: 'kaftanLength',
    step: 2,
    label: 'Top / Kaftan Length',
    tip: 'From base of neck/collar seam down to desired kaftan hemline.',
    optional: false,
    placeholders: { in: '46', cm: '117' },
    ranges: {
      in: { min: 26, max: 60 },
      cm: { min: 66, max: 152 }
    }
  },
  height: {
    id: 'height',
    step: 3,
    label: 'Height',
    tip: 'Standing straight against a flat wall, barefoot.',
    optional: true,
    placeholders: { in: '70', cm: '178' },
    ranges: {
      in: { min: 48, max: 86 },
      cm: { min: 120, max: 220 }
    }
  }
};

/**
 * Convert a measurement between inches and centimeters
 * @param {number|string} value
 * @param {'in'|'cm'} fromUnit
 * @param {'in'|'cm'} toUnit
 * @returns {number|string} converted value rounded to 1 decimal place, or empty string
 */
export function convertMeasurement(value, fromUnit, toUnit) {
  if (value === '' || value == null) return '';
  const num = typeof value === 'number' ? value : parseFloat(String(value).trim());
  if (isNaN(num) || num <= 0) return '';

  if (fromUnit === toUnit) {
    return Math.round(num * 10) / 10;
  }

  if (fromUnit === 'in' && toUnit === 'cm') {
    return Math.round(num * 2.54 * 10) / 10;
  }

  if (fromUnit === 'cm' && toUnit === 'in') {
    return Math.round((num / 2.54) * 10) / 10;
  }

  return num;
}

/**
 * Validate a single measurement value
 * @param {string} fieldId
 * @param {string|number} value
 * @param {'in'|'cm'} unit
 * @param {boolean} isRequired
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateMeasurement(fieldId, value, unit = 'in', isRequired = true) {
  const config = MEASUREMENT_CONFIG[fieldId];
  if (!config) return { valid: true };

  const strVal = value != null ? String(value).trim() : '';

  if (!strVal) {
    if (isRequired && !config.optional) {
      return { valid: false, error: `Please enter your ${config.label.toLowerCase()}` };
    }
    return { valid: true };
  }

  const num = parseFloat(strVal);
  if (isNaN(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }

  const range = config.ranges[unit] || config.ranges.in;
  if (num < range.min) {
    return {
      valid: false,
      error: `${config.label} must be at least ${range.min} ${unit}`
    };
  }
  if (num > range.max) {
    return {
      valid: false,
      error: `${config.label} cannot exceed ${range.max} ${unit}`
    };
  }

  return { valid: true };
}

/**
 * Validate all fields for a given step
 * @param {number} step (1, 2, or 3)
 * @param {object} data
 * @param {'in'|'cm'} unit
 * @param {boolean} isCustom
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateMeasurementsStep(step, data = {}, unit = 'in', isCustom = true) {
  const errors = {};

  if (step === 1 || step === 2) {
    const fields = Object.values(MEASUREMENT_CONFIG).filter((f) => f.step === step);
    for (const field of fields) {
      const res = validateMeasurement(field.id, data[field.id], unit, isCustom);
      if (!res.valid && res.error) {
        errors[field.id] = res.error;
      }
    }
  } else if (step === 3) {
    // Height validation (optional)
    if (data.height) {
      const res = validateMeasurement('height', data.height, unit, false);
      if (!res.valid && res.error) {
        errors.height = res.error;
      }
    }

    // Name is required
    const clientName = (data.clientName || '').trim();
    if (!clientName) {
      errors.clientName = 'Please enter your name';
    }

    // Phone is required
    const clientPhone = (data.clientPhone || '').trim();
    if (!clientPhone) {
      errors.clientPhone = 'Please enter your WhatsApp phone number';
    } else {
      const digits = clientPhone.replace(/\D/g, '');
      if (digits.length < 8) {
        errors.clientPhone = 'Please enter a valid phone number';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Build a neat, well-structured WhatsApp order message for custom or standard tailoring
 * @param {object} params
 * @returns {string}
 */
export function buildMeasurementsMessage({
  productName = 'Bespoke Garment',
  productPrice,
  size = 'Custom',
  measurements = {},
  unit = 'in',
  fitPreference = 'Regular',
  notes = '',
  clientName = '',
  clientPhone = '',
  pageUrl = '',
  skippedMeasurements = false
} = {}) {
  const priceFormatted = productPrice != null ? formatPrice(productPrice) : '';

  const lines = [
    'Hello Ezekiel, I would like to order bespoke tailoring from Apparel by Ezekiel:',
    '',
    `• Garment: ${productName}`,
    priceFormatted ? `• Price: ${priceFormatted}` : null,
    `• Size: ${size}${size === 'Custom' ? ' (Custom Bespoke Tailoring)' : ' (Standard Size)'}`,
    '',
    'Client Information:',
    clientName ? `• Name: ${clientName}` : null,
    clientPhone ? `• Phone: ${clientPhone}` : null,
    fitPreference ? `• Fit Preference: ${fitPreference}` : null,
    notes ? `• Special Notes: ${notes}` : null
  ].filter(Boolean);

  lines.push('');
  if (skippedMeasurements || (size !== 'Custom' && Object.keys(measurements).length === 0)) {
    lines.push(`Measurements: Standard Size ${size} selected (custom measurements skipped).`);
  } else {
    lines.push(`Measurements (${unit}):`);
    const measurementLabels = [
      { id: 'chest', label: 'Chest' },
      { id: 'shoulder', label: 'Shoulder Width' },
      { id: 'sleeve', label: 'Sleeve Length' },
      { id: 'neck', label: 'Neck' },
      { id: 'waist', label: 'Waist' },
      { id: 'hip', label: 'Hip' },
      { id: 'trouserLength', label: 'Trouser Length' },
      { id: 'kaftanLength', label: 'Top / Kaftan Length' },
      { id: 'height', label: 'Height' }
    ];

    for (const item of measurementLabels) {
      const val = measurements[item.id];
      if (val != null && String(val).trim() !== '') {
        lines.push(`• ${item.label}: ${val} ${unit}`);
      }
    }
  }

  if (pageUrl) {
    lines.push('');
    lines.push(`Link: ${pageUrl}`);
  }

  return lines.join('\n');
}

/**
 * Build WhatsApp URL for measurements order
 * @param {string} phone
 * @param {object} payload
 * @returns {string}
 */
export function buildWhatsAppMeasurementsUrl(phone = '2347065086445', payload = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const message = buildMeasurementsMessage(payload);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Parse price input into integer Naira value.
 * Handles inputs with currency symbol (₦), commas, spaces, or decimals.
 * @param {string|number|null|undefined} input
 * @returns {number} Non-negative integer
 */
export function parsePrice(input) {
  if (input == null) return 0;
  if (typeof input === 'number') {
    if (isNaN(input) || input < 0) return 0;
    return Math.round(input);
  }
  const cleanStr = String(input)
    .replace(/[₦,$\s]/g, '')
    .trim();
  const num = parseFloat(cleanStr);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num);
}

/**
 * Generate a URL-friendly slug from product name.
 * e.g. "Kaftan 010 – Royal Sand" -> "kaftan-010-royal-sand"
 * @param {string} name
 * @returns {string}
 */
export function generateSlug(name) {
  if (!name || typeof name !== 'string') return 'garment';
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, ''); // trim leading and trailing hyphens

  return slug || 'garment';
}

/**
 * Calculate scaled dimensions for client-side image resizing,
 * ensuring neither width nor height exceeds maxDimension while preserving aspect ratio.
 * @param {number} width
 * @param {number} height
 * @param {number} maxDimension
 * @returns {{ width: number, height: number }}
 */
export function calculateResizeDimensions(width, height, maxDimension = 1600) {
  const w = Math.round(Number(width) || 0);
  const h = Math.round(Number(height) || 0);
  const max = Math.round(Number(maxDimension) || 1600);

  if (w <= 0 || h <= 0) {
    return { width: 0, height: 0 };
  }

  if (w <= max && h <= max) {
    return { width: w, height: h };
  }

  if (w >= h) {
    const scale = max / w;
    return {
      width: max,
      height: Math.max(1, Math.round(h * scale))
    };
  } else {
    const scale = max / h;
    return {
      width: Math.max(1, Math.round(w * scale)),
      height: max
    };
  }
}

/**
 * Normalize product object from Supabase or JSON fallback to uniform structure
 * @param {object} p
 * @returns {object|null}
 */
export function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return null;

  const slug = (p.slug || p.id || '').trim();
  const id = (p.id || slug || '').trim();
  const rawImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : (p.image ? [p.image] : []);
  const images = rawImages.filter((img) => typeof img === 'string' && img.trim().length > 0);

  const rawSizes = Array.isArray(p.sizes) && p.sizes.length > 0
    ? p.sizes
    : ['S', 'M', 'L', 'XL', 'XXL', 'Custom'];
  const sizes = rawSizes.filter((s) => typeof s === 'string' && s.trim().length > 0);
  const makingDaysRes = validateMakingDays(p.making_days);
  const making_days = makingDaysRes.valid ? makingDaysRes.value : null;

  return {
    id: id || slug || 'product',
    slug: slug || id || 'product',
    name: (p.name || 'Untitled Garment').trim(),
    category: (p.category || 'Kaftans').trim(),
    price: parsePrice(p.price),
    making_days,
    description: (p.description || '').trim(),
    details: (p.details || '').trim(),
    sizes,
    images,
    image: images[0] || '',
    is_published: p.is_published !== false,
    sort_order: typeof p.sort_order === 'number' && !isNaN(p.sort_order) ? p.sort_order : 0,
    created_at: p.created_at || null,
    updated_at: p.updated_at || null
  };
}

/**
 * Determine products to display with robust fallback to bundled products
 * @param {Array|null|undefined} apiProducts
 * @param {Array} fallbackProducts
 * @returns {Array}
 */
export function loadProductsFallback(apiProducts, fallbackProducts = []) {
  if (Array.isArray(apiProducts) && apiProducts.length > 0) {
    return apiProducts.map(normalizeProduct).filter(Boolean);
  }
  if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
    return fallbackProducts.map(normalizeProduct).filter(Boolean);
  }
  return [];
}

/**
 * Convert Nigerian Naira (NGN) to Kobo (1 Naira = 100 Kobo).
 * Always returns a non-negative integer.
 * @param {number|string|null|undefined} amount
 * @returns {number} Amount in kobo
 */
export function nairaToKobo(amount) {
  if (amount == null) return 0;
  let num;
  if (typeof amount === 'number') {
    num = amount;
  } else {
    const clean = String(amount).replace(/[₦,$\s]/g, '').trim();
    num = parseFloat(clean);
  }
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

/**
 * Convert Kobo to Nigerian Naira (NGN).
 * @param {number|string|null|undefined} kobo
 * @returns {number} Amount in Naira
 */
export function koboToNaira(kobo) {
  if (kobo == null) return 0;
  const num = typeof kobo === 'number' ? kobo : Number(kobo);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num / 100);
}

/**
 * Validate tailoring turnaround time (making_days).
 * Must be null/empty or an integer between 1 and 90.
 * @param {*} days
 * @returns {{ valid: boolean, value: number|null, error?: string }}
 */
export function validateMakingDays(days) {
  if (days === null || days === undefined || days === '') {
    return { valid: true, value: null };
  }
  const clean = typeof days === 'string' ? days.trim() : days;
  if (clean === '') {
    return { valid: true, value: null };
  }
  const num = Number(clean);
  if (!Number.isInteger(num)) {
    return { valid: false, value: null, error: 'Days to make must be an integer' };
  }
  if (num < 1 || num > 90) {
    return { valid: false, value: null, error: 'Days to make must be between 1 and 90' };
  }
  return { valid: true, value: num };
}

/**
 * Calculate expected ready date given a start date and turnaround days.
 * @param {Date|string|number} startDate
 * @param {number|string|null} makingDays
 * @returns {string|null} ISO date string (YYYY-MM-DD) or null
 */
export function calculateExpectedReadyDate(startDate = new Date(), makingDays = null) {
  const { valid, value } = validateMakingDays(makingDays);
  if (!valid || value == null || value <= 0) return null;
  const date = startDate instanceof Date ? new Date(startDate.getTime()) : new Date(startDate);
  if (isNaN(date.getTime())) return null;
  date.setDate(date.getDate() + value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Human-readable date formatter for expected ready date
 * e.g. "2026-11-26" -> "Thu, Nov 26, 2026"
 * @param {Date|string} dateInput
 * @returns {string}
 */
export function formatExpectedReadyDate(dateInput) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return String(dateInput);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Recursively sort object keys alphabetically for signature hashing
 * @param {*} obj
 * @returns {*}
 */
export function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sortObjectKeys);
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectKeys(obj[key]);
      return acc;
    }, {});
}

/**
 * Generate HMAC-SHA512 hex signature for OPay API requests/verification
 * @param {object|string} payload
 * @param {string} secretKey
 * @returns {Promise<string>} Hex signature
 */
export async function generateOpaySignature(payload, secretKey) {
  if (!secretKey) throw new Error('Secret key is required for OPay signature');
  const message =
    typeof payload === 'object' && payload !== null
      ? JSON.stringify(sortObjectKeys(payload))
      : String(payload ?? '');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secretKey),
    { name: 'HMAC', hash: 'SHA-512' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Verify incoming OPay webhook signature with constant-time equality check
 * @param {object|string} rawBody
 * @param {string} signature
 * @param {string} secretKey
 * @returns {Promise<boolean>}
 */
export async function verifyOpaySignature(rawBody, signature, secretKey) {
  if (!signature || !secretKey) return false;
  const cleanSig = String(signature).replace(/^Bearer\s+/i, '').trim().toLowerCase();
  const computed = await generateOpaySignature(rawBody, secretKey);
  if (cleanSig.length !== computed.length) return false;
  let mismatch = 0;
  for (let i = 0; i < cleanSig.length; i++) {
    mismatch |= cleanSig.charCodeAt(i) ^ computed.charCodeAt(i);
  }
  return mismatch === 0;
}

