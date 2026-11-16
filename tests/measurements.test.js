import { describe, it, expect } from 'vitest';
import {
  convertMeasurement,
  validateMeasurement,
  validateMeasurementsStep,
  buildMeasurementsMessage,
  buildWhatsAppMeasurementsUrl,
  MEASUREMENT_CONFIG
} from '../src/utils.js';

describe('Unit Conversion: convertMeasurement', () => {
  it('converts inches to centimeters accurately (1 in = 2.54 cm)', () => {
    // 40 in -> 101.6 cm
    expect(convertMeasurement(40, 'in', 'cm')).toBe(101.6);
    // 15.5 in -> 39.37 -> 39.4 cm
    expect(convertMeasurement(15.5, 'in', 'cm')).toBe(39.4);
    // 32 in -> 81.28 -> 81.3 cm
    expect(convertMeasurement(32, 'in', 'cm')).toBe(81.3);
  });

  it('converts centimeters to inches accurately (1 cm = 0.3937 in)', () => {
    // 101.6 cm -> 40 in
    expect(convertMeasurement(101.6, 'cm', 'in')).toBe(40);
    // 81.3 cm -> 32.0 in
    expect(convertMeasurement(81.3, 'cm', 'in')).toBe(32);
    // 100 cm -> 39.37 -> 39.4 in
    expect(convertMeasurement(100, 'cm', 'in')).toBe(39.4);
  });

  it('preserves values when fromUnit and toUnit match', () => {
    expect(convertMeasurement(42, 'in', 'in')).toBe(42);
    expect(convertMeasurement(105.5, 'cm', 'cm')).toBe(105.5);
  });

  it('returns empty string for empty, non-numeric, or null values', () => {
    expect(convertMeasurement('', 'in', 'cm')).toBe('');
    expect(convertMeasurement(null, 'in', 'cm')).toBe('');
    expect(convertMeasurement(undefined, 'in', 'cm')).toBe('');
    expect(convertMeasurement('abc', 'in', 'cm')).toBe('');
    expect(convertMeasurement(-5, 'in', 'cm')).toBe('');
  });
});

describe('Measurement Validation: validateMeasurement & validateMeasurementsStep', () => {
  it('validates chest measurement in inches within sensible range', () => {
    expect(validateMeasurement('chest', 42, 'in', true)).toEqual({ valid: true });
    expect(validateMeasurement('chest', 20, 'in', true).valid).toBe(false);
    expect(validateMeasurement('chest', 75, 'in', true).valid).toBe(false);
  });

  it('validates chest measurement in centimeters within sensible range', () => {
    expect(validateMeasurement('chest', 105, 'cm', true)).toEqual({ valid: true });
    expect(validateMeasurement('chest', 50, 'cm', true).valid).toBe(false);
    expect(validateMeasurement('chest', 180, 'cm', true).valid).toBe(false);
  });

  it('enforces required fields for custom sizing', () => {
    const emptyResult = validateMeasurement('shoulder', '', 'in', true);
    expect(emptyResult.valid).toBe(false);
    expect(emptyResult.error).toContain('Please enter your shoulder');
  });

  it('allows empty values when field is optional (standard size or height)', () => {
    expect(validateMeasurement('shoulder', '', 'in', false)).toEqual({ valid: true });
    expect(validateMeasurement('height', '', 'in', true)).toEqual({ valid: true });
  });

  it('validates entire Step 1 (upper body) data', () => {
    const validData = {
      chest: '40',
      shoulder: '19',
      sleeve: '25',
      neck: '16'
    };
    const res = validateMeasurementsStep(1, validData, 'in', true);
    expect(res.isValid).toBe(true);
    expect(Object.keys(res.errors)).toHaveLength(0);

    const invalidData = {
      chest: '10', // Too small
      shoulder: '19',
      sleeve: '', // Missing
      neck: '16'
    };
    const badRes = validateMeasurementsStep(1, invalidData, 'in', true);
    expect(badRes.isValid).toBe(false);
    expect(badRes.errors.chest).toBeDefined();
    expect(badRes.errors.sleeve).toBeDefined();
  });

  it('validates entire Step 2 (lower body & length) data', () => {
    const validData = {
      waist: '34',
      hip: '40',
      trouserLength: '42',
      kaftanLength: '48'
    };
    const res = validateMeasurementsStep(2, validData, 'in', true);
    expect(res.isValid).toBe(true);

    const missingData = {
      waist: '34',
      hip: '',
      trouserLength: '42',
      kaftanLength: '48'
    };
    const badRes = validateMeasurementsStep(2, missingData, 'in', true);
    expect(badRes.isValid).toBe(false);
    expect(badRes.errors.hip).toBeDefined();
  });

  it('validates Step 3 client name and phone number', () => {
    const validDetails = {
      clientName: 'Ezekiel Adebayo',
      clientPhone: '+234 706 508 6445',
      height: '70'
    };
    const res = validateMeasurementsStep(3, validDetails, 'in', true);
    expect(res.isValid).toBe(true);

    const invalidDetails = {
      clientName: '',
      clientPhone: '123' // Too short
    };
    const badRes = validateMeasurementsStep(3, invalidDetails, 'in', true);
    expect(badRes.isValid).toBe(false);
    expect(badRes.errors.clientName).toBeDefined();
    expect(badRes.errors.clientPhone).toBeDefined();
  });
});

describe('WhatsApp Message Generation: buildMeasurementsMessage & buildWhatsAppMeasurementsUrl', () => {
  const sampleOrder = {
    productName: 'Emerald Silk Kaftan',
    productPrice: 120000,
    size: 'Custom',
    measurements: {
      chest: '42',
      shoulder: '19.5',
      sleeve: '26',
      neck: '16.5',
      waist: '34',
      hip: '41',
      trouserLength: '42',
      kaftanLength: '46',
      height: '71'
    },
    unit: 'in',
    fitPreference: 'Regular',
    notes: 'Please add 1 extra inch to sleeve length',
    clientName: 'Oluwaseun Sanni',
    clientPhone: '+2348012345678',
    pageUrl: 'http://localhost:4173/#product/kaftan-010'
  };

  it('builds a complete prefilled WhatsApp order message with measurements and details', () => {
    const msg = buildMeasurementsMessage(sampleOrder);
    expect(msg).toContain('Emerald Silk Kaftan');
    expect(msg).toContain('₦120,000');
    expect(msg).toContain('Size: Custom (Custom Bespoke Tailoring)');
    expect(msg).toContain('Name: Oluwaseun Sanni');
    expect(msg).toContain('Phone: +2348012345678');
    expect(msg).toContain('Fit Preference: Regular');
    expect(msg).toContain('Special Notes: Please add 1 extra inch to sleeve length');
    expect(msg).toContain('Measurements (in):');
    expect(msg).toContain('• Chest: 42 in');
    expect(msg).toContain('• Shoulder Width: 19.5 in');
    expect(msg).toContain('• Sleeve Length: 26 in');
    expect(msg).toContain('• Neck: 16.5 in');
    expect(msg).toContain('• Waist: 34 in');
    expect(msg).toContain('• Hip: 41 in');
    expect(msg).toContain('• Trouser Length: 42 in');
    expect(msg).toContain('• Top / Kaftan Length: 46 in');
    expect(msg).toContain('• Height: 71 in');
    expect(msg).toContain('Link: http://localhost:4173/#product/kaftan-010');
  });

  it('handles standard sizes with measurements skipped gracefully', () => {
    const standardOrder = {
      productName: 'Royal Agbada Ensemble',
      productPrice: 185000,
      size: 'XL',
      measurements: {},
      skippedMeasurements: true,
      fitPreference: 'Relaxed',
      clientName: 'Tunde Bakare',
      clientPhone: '+2348099887766'
    };
    const msg = buildMeasurementsMessage(standardOrder);
    expect(msg).toContain('Size: XL (Standard Size)');
    expect(msg).toContain('Standard Size XL selected (custom measurements skipped)');
    expect(msg).toContain('Name: Tunde Bakare');
  });

  it('generates a valid https://wa.me/ URL with URI-encoded text', () => {
    const url = buildWhatsAppMeasurementsUrl('2347065086445', sampleOrder);
    expect(url.startsWith('https://wa.me/2347065086445?text=')).toBe(true);
    expect(url).toContain(encodeURIComponent('Emerald Silk Kaftan'));
    expect(url).toContain(encodeURIComponent('Oluwaseun Sanni'));
    expect(url).toContain(encodeURIComponent('• Chest: 42 in'));
  });
});
