/**
 * Per-garment anchors in the overlay image's own pixel coordinates (600x750 viewBox).
 * { shoulderL: [x, y], shoulderR: [x, y], waistY, fit: 'fitted' | 'flowing' }
 * Derived from each public/designs/*-overlay.svg.
 */

export const GARMENT_ANCHORS = {
  'imperial-agbada': {
    shoulderL: [180, 285],
    shoulderR: [420, 285],
    waistY: 440,
    fit: 'flowing'
  },
  'obsidian-senator': {
    shoulderL: [205, 268],
    shoulderR: [395, 268],
    waistY: 435,
    fit: 'fitted'
  },
  'royal-velvet-kaftan': {
    shoulderL: [200, 270],
    shoulderR: [400, 270],
    waistY: 430,
    fit: 'flowing'
  },
  'grandeur-tuxedo': {
    shoulderL: [195, 270],
    shoulderR: [405, 270],
    waistY: 430,
    fit: 'fitted'
  },
  'sahara-linen-set': {
    shoulderL: [200, 270],
    shoulderR: [400, 270],
    waistY: 430,
    fit: 'flowing'
  },
  'signature-safari-jacket': {
    shoulderL: [205, 268],
    shoulderR: [395, 268],
    waistY: 435,
    fit: 'fitted'
  },
  'monarch-brocade': {
    shoulderL: [180, 285],
    shoulderR: [420, 285],
    waistY: 440,
    fit: 'flowing'
  },
  'aura-kimono-kaftan': {
    shoulderL: [200, 270],
    shoulderR: [400, 270],
    waistY: 430,
    fit: 'flowing'
  }
};

/**
 * Returns the anchors for a given design id, with safe fallback.
 */
export function getAnchors(designId) {
  if (designId && GARMENT_ANCHORS[designId]) {
    return GARMENT_ANCHORS[designId];
  }
  return {
    shoulderL: [200, 270],
    shoulderR: [400, 270],
    waistY: 430,
    fit: 'fitted'
  };
}
