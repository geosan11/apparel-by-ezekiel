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
