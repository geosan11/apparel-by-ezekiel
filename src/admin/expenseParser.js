/**
 * Rule-based Expense Parser for Apparel by Ezekiel
 * Parses natural language expense entries without external AI services.
 * Handles amounts (18k, 18,000, ₦18000, N18000, 1.5m), categories, and dates.
 */

export const CATEGORIES = [
  'fabric',
  'thread',
  'transport',
  'logistics',
  'staff',
  'rent',
  'power/fuel',
  'marketing',
  'packaging',
  'other'
];

export const CATEGORY_KEYWORDS = {
  fabric: [
    'fabric', 'fabrics', 'damask', 'material', 'materials', 'lace', 'wool',
    'linen', 'cashmere', 'velvet', 'silk', 'brocade', 'aso-oke', 'asooke',
    'lining', 'crepe', 'cotton', 'textile', 'cloth'
  ],
  thread: [
    'thread', 'threads', 'button', 'buttons', 'zipper', 'zips', 'zip',
    'interfacing', 'stay', 'collar stay', 'needle', 'needles', 'trims',
    'cufflink', 'buckle', 'hardware'
  ],
  transport: [
    'transport', 'transportation', 'cab', 'uber', 'bolt', 'okada',
    'keke', 'bus', 'fare', 'trip', 't-fare', 'tfare'
  ],
  logistics: [
    'logistics', 'delivery', 'dispatch', 'courier', 'waybill', 'shipping',
    'dhl', 'gig', 'dispatch rider', 'haulage'
  ],
  staff: [
    'staff', 'salary', 'salaries', 'tailor', 'apprentice', 'wages', 'wage',
    'ironing guy', 'stitching', 'labor', 'workmanship', 'seamstress', 'artisan'
  ],
  rent: [
    'rent', 'shop rent', 'atelier rent', 'lease', 'showroom rent',
    'service charge', 'workshop rent'
  ],
  'power/fuel': [
    'power', 'fuel', 'diesel', 'generator', 'gen', 'petrol', 'nepa',
    'ekedc', 'ikedc', 'electricity', 'light', 'electric', 'oil'
  ],
  marketing: [
    'marketing', 'ad', 'ads', 'instagram ad', 'meta', 'influencer',
    'promo', 'flyer', 'photography', 'photoshoot', 'model', 'lookbook',
    'branding', 'social media'
  ],
  packaging: [
    'packaging', 'package', 'box', 'boxes', 'bag', 'bags', 'hanger',
    'hangers', 'carrier', 'garment bag', 'tag', 'tags', 'labels', 'label',
    'ribbon', 'carrier bag'
  ],
  other: ['other', 'misc', 'miscellaneous', 'water', 'cleaning', 'refreshment']
};

/**
 * Parses an amount string into numeric value
 * Supports 18k, 18K, 1.5m, 1.5M, ₦18000, N18000, 18,000, 18000
 */
export function parseAmount(text) {
  if (!text) return null;

  // Normalize currency prefixes (₦, N, #, NGN, Naira)
  // Look for amount pattern with optional prefix, digits, commas/dots, and optional k/m suffix
  // e.g. ₦18,000 | N18000 | 18k | 1.5m | ₦1.5m | 2500
  const amountRegex = /(?:₦|N|#|NGN\s*|Naira\s*)?\s*(\d+(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)\s*([kKmMbB])?\b/gi;

  let match;
  let bestAmount = null;

  while ((match = amountRegex.exec(text)) !== null) {
    const rawNumber = match[1].replace(/,/g, '');
    const suffix = match[2] ? match[2].toLowerCase() : null;
    let value = parseFloat(rawNumber);

    if (isNaN(value)) continue;

    if (suffix === 'k') {
      value *= 1000;
    } else if (suffix === 'm') {
      value *= 1000000;
    } else if (suffix === 'b') {
      value *= 1000000000;
    }

    // Heuristic: Avoid picking 4-digit years like 2024, 2025, 2026 unless prefixed with currency
    const fullMatch = match[0].trim();
    const hasCurrency = /(?:₦|N|#|NGN|Naira)/i.test(fullMatch);
    if (!hasCurrency && !suffix && value >= 1990 && value <= 2040 && Number.isInteger(value)) {
      // Could be a year, skip unless nothing else found
      if (!bestAmount) bestAmount = { value, raw: fullMatch, index: match.index, isYearCandidate: true };
      continue;
    }

    return {
      value: Math.round(value * 100) / 100,
      raw: fullMatch,
      index: match.index,
      length: fullMatch.length
    };
  }

  if (bestAmount && !bestAmount.isYearCandidate) {
    return {
      value: bestAmount.value,
      raw: bestAmount.raw,
      index: bestAmount.index,
      length: bestAmount.raw.length
    };
  }

  return null;
}

/**
 * Finds the best matching category based on keywords
 * When multiple keywords match, favors the earliest keyword in the sentence
 * (e.g. "Uber to fabric market" -> transport, "Bought fabric and buttons" -> fabric)
 */
export function parseCategory(text) {
  if (!text) return 'other';
  const lower = text.toLowerCase();

  let earliestMatch = null;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      const escaped = kw.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      const match = regex.exec(lower);
      if (match) {
        if (!earliestMatch || match.index < earliestMatch.index) {
          earliestMatch = {
            category,
            index: match.index
          };
        }
      }
    }
  }

  return earliestMatch ? earliestMatch.category : 'other';
}

const WEEKDAYS = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses dates from natural language (today, yesterday, last <weekday>, explicit YYYY-MM-DD)
 */
export function parseDate(text, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  const lower = text ? text.toLowerCase() : '';

  // 1. Explicit ISO date (YYYY-MM-DD)
  const isoMatch = text ? text.match(/\b(20\d\d)-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/) : null;
  if (isoMatch) {
    return {
      date: isoMatch[0],
      raw: isoMatch[0]
    };
  }

  // 2. 'today'
  if (/\btoday\b/i.test(lower)) {
    return {
      date: formatDateISO(ref),
      raw: 'today'
    };
  }

  // 3. 'yesterday'
  if (/\byesterday\b/i.test(lower)) {
    const yesterday = new Date(ref);
    yesterday.setDate(yesterday.getDate() - 1);
    return {
      date: formatDateISO(yesterday),
      raw: 'yesterday'
    };
  }

  // 4. 'last <weekday>' (e.g., last friday, last monday)
  const lastWeekdayMatch = lower.match(/\blast\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (lastWeekdayMatch) {
    const targetDay = WEEKDAYS[lastWeekdayMatch[1]];
    const currentDay = ref.getDay();
    let diff = (currentDay - targetDay + 7) % 7;
    if (diff === 0) diff = 7; // strictly last week if today is that weekday
    const targetDate = new Date(ref);
    targetDate.setDate(targetDate.getDate() - diff);
    return {
      date: formatDateISO(targetDate),
      raw: lastWeekdayMatch[0]
    };
  }

  // 5. just '<weekday>' (e.g., on friday, wednesday) -> most recent past occurrence
  const weekdayMatch = lower.match(/\b(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i);
  if (weekdayMatch) {
    const targetDay = WEEKDAYS[weekdayMatch[1]];
    const currentDay = ref.getDay();
    let diff = (currentDay - targetDay + 7) % 7;
    // if diff === 0, it means today
    const targetDate = new Date(ref);
    targetDate.setDate(targetDate.getDate() - diff);
    return {
      date: formatDateISO(targetDate),
      raw: weekdayMatch[0]
    };
  }

  // Default to today
  return {
    date: formatDateISO(ref),
    raw: 'today (default)'
  };
}

/**
 * Main parse function
 * Takes user input string and returns structured expense data.
 */
export function parseExpenseText(input, referenceDate = new Date()) {
  if (!input || typeof input !== 'string') {
    return null;
  }

  const trimmed = input.trim();
  if (!trimmed) return null;

  const amountResult = parseAmount(trimmed);
  if (!amountResult || amountResult.value <= 0) {
    return null;
  }

  const category = parseCategory(trimmed);
  const dateResult = parseDate(trimmed, referenceDate);

  // Derive a clean description:
  // remove the matched amount and date keywords, or retain clean description
  let desc = trimmed;
  if (amountResult.raw) {
    desc = desc.replace(amountResult.raw, ' ');
  }
  if (dateResult.raw && dateResult.raw !== 'today (default)') {
    desc = desc.replace(new RegExp(`\\b${dateResult.raw}\\b`, 'gi'), ' ');
  }
  // Remove filler words
  desc = desc
    .replace(/\b(paid|for|bought|spent|purchase|cost|on|naira|amount)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If description ended up empty or just category, provide category title
  if (!desc) {
    desc = category.charAt(0).toUpperCase() + category.slice(1);
  } else {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return {
    amount: amountResult.value,
    formattedAmount: `₦${amountResult.value.toLocaleString('en-NG')}`,
    category,
    date: dateResult.date,
    description: desc,
    rawInput: trimmed
  };
}
