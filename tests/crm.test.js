import { describe, it, expect } from 'vitest';
import {
  normalizePhone,
  deriveStatus,
  nextFollowUp,
  validateMeasurements,
  formatMeasurement,
  ordersForCustomer,
  findPossibleDuplicates,
  rebuildCustomersFromOrders,
  escapeHtml
} from '../src/admin/crm.js';

describe('CRM Pure Logic (src/admin/crm.js)', () => {
  describe('normalizePhone', () => {
    it('normalizes local 0803… format to +234803…', () => {
      expect(normalizePhone('08031234567')).toBe('+2348031234567');
      expect(normalizePhone('07019876543')).toBe('+2347019876543');
    });

    it('normalizes 234… format to +234…', () => {
      expect(normalizePhone('2348031234567')).toBe('+2348031234567');
      expect(normalizePhone('2349051112233')).toBe('+2349051112233');
    });

    it('leaves +234… unchanged', () => {
      expect(normalizePhone('+2348031234567')).toBe('+2348031234567');
      expect(normalizePhone('+2348129876543')).toBe('+2348129876543');
    });

    it('strips spaces, dashes, brackets, and dots', () => {
      expect(normalizePhone('0803-123-4567')).toBe('+2348031234567');
      expect(normalizePhone('+234 (803) 123 4567')).toBe('+2348031234567');
      expect(normalizePhone(' 0803 123.4567 ')).toBe('+2348031234567');
    });

    it('keeps other international + numbers', () => {
      expect(normalizePhone('+14155552671')).toBe('+14155552671');
      expect(normalizePhone('+44 7911 123456')).toBe('+447911123456');
    });

    it('returns empty string for empty or garbage inputs', () => {
      expect(normalizePhone('')).toBe('');
      expect(normalizePhone('   ')).toBe('');
      expect(normalizePhone(null)).toBe('');
      expect(normalizePhone(undefined)).toBe('');
      expect(normalizePhone('invalid-text')).toBe('');
      expect(normalizePhone('---')).toBe('');
      expect(normalizePhone('123')).toBe('');
    });
  });

  describe('deriveStatus', () => {
    const today = '2026-11-03';

    it('returns "due" when customer has an undone follow-up due on or before today', () => {
      const customerDueToday = {
        id: 'CUS-1',
        phone_norm: '+2348031234567',
        follow_up: { due: '2026-11-03', note: 'Call client', done_at: null }
      };
      expect(deriveStatus(customerDueToday, [], today)).toBe('due');

      const customerOverdue = {
        id: 'CUS-2',
        phone_norm: '+2348031234567',
        follow_up: { due: '2026-11-01', note: 'Overdue fitting', done_at: null }
      };
      expect(deriveStatus(customerOverdue, [], today)).toBe('due');
    });

    it('ignores completed follow-ups and future follow-ups for "due" status', () => {
      const customerDone = {
        id: 'CUS-3',
        phone_norm: '+2348031234567',
        follow_up: { due: '2026-11-01', note: 'Done', done_at: '2026-11-02T10:00:00Z' }
      };
      expect(deriveStatus(customerDone, [], today)).toBe('quiet');

      const customerFuture = {
        id: 'CUS-4',
        phone_norm: '+2348031234567',
        follow_up: { due: '2026-11-10', note: 'Future call', done_at: null }
      };
      expect(deriveStatus(customerFuture, [], today)).toBe('quiet');
    });

    it('returns "active" if any linked order is not Delivered, Completed, or Cancelled', () => {
      const customer = { id: 'CUS-5', phone_norm: '+2348031234567', follow_up: null };
      const orders = [
        { customer_id: 'CUS-5', status: 'In Progress' }
      ];
      expect(deriveStatus(customer, orders, today)).toBe('active');

      const ordersByPhone = [
        { customer_phone: '+2348031234567', status: 'Ready' }
      ];
      expect(deriveStatus(customer, ordersByPhone, today)).toBe('active');
    });

    it('returns "quiet" if all linked orders are Delivered/Completed/Cancelled or if none exist', () => {
      const customer = { id: 'CUS-6', phone_norm: '+2348031234567', follow_up: null };
      expect(deriveStatus(customer, [], today)).toBe('quiet');

      const inactiveOrders = [
        { customer_id: 'CUS-6', status: 'Delivered' },
        { customer_id: 'CUS-6', status: 'Cancelled' }
      ];
      expect(deriveStatus(customer, inactiveOrders, today)).toBe('quiet');
    });
  });

  describe('nextFollowUp', () => {
    const today = '2026-11-03';

    it('picks the single undone follow-up with the earliest due date <= today', () => {
      const customers = [
        {
          id: 'CUS-A',
          name: 'Chief Kuti',
          phone: '+2348022233445',
          phone_norm: '+2348022233445',
          follow_up: { due: '2026-11-03', note: 'Fitting confirmation', done_at: null }
        },
        {
          id: 'CUS-B',
          name: 'Dr. Alabi',
          phone: '+2348031234567',
          phone_norm: '+2348031234567',
          follow_up: { due: '2026-11-01', note: 'Urgent check-in', done_at: null }
        }
      ];

      const next = nextFollowUp(customers, today);
      expect(next).not.toBeNull();
      expect(next.customerId).toBe('CUS-B');
      expect(next.customerName).toBe('Dr. Alabi');
      expect(next.due).toBe('2026-11-01');
      expect(next.note).toBe('Urgent check-in');
    });

    it('ignores done follow-ups and future follow-ups, returning null if none are due', () => {
      const customers = [
        {
          id: 'CUS-1',
          name: 'Done Customer',
          follow_up: { due: '2026-10-30', note: 'Old', done_at: '2026-10-31T00:00:00Z' }
        },
        {
          id: 'CUS-2',
          name: 'Future Customer',
          follow_up: { due: '2026-11-15', note: 'Later', done_at: null }
        },
        {
          id: 'CUS-3',
          name: 'No follow up',
          follow_up: null
        }
      ];

      expect(nextFollowUp(customers, today)).toBeNull();
      expect(nextFollowUp([], today)).toBeNull();
    });
  });

  describe('validateMeasurements', () => {
    it('accepts blanks (null, empty strings, undefined) as valid nulls', () => {
      const result = validateMeasurements({
        chest: null,
        waist: '',
        hips: undefined,
        shoulder: '   ',
        sleeve: null
      }, 'in');

      expect(result.ok).toBe(true);
      expect(result.errors).toEqual({});
      expect(result.inches).toEqual({
        chest: null,
        waist: null,
        hips: null,
        shoulder: null,
        sleeve: null
      });
    });

    it('validates sane ranges in inches (8–80) and rounds to 0.25', () => {
      const valid = validateMeasurements({
        chest: 44.1,
        waist: '38',
        hips: '42.5',
        shoulder: 19.3,
        sleeve: 26
      }, 'in');

      expect(valid.ok).toBe(true);
      expect(valid.inches.chest).toBe(44); // 44.1 rounded to 0.25 is 44
      expect(valid.inches.shoulder).toBe(19.25); // 19.3 rounded to 0.25 is 19.25

      const invalid = validateMeasurements({ chest: 5, waist: 90 }, 'in');
      expect(invalid.ok).toBe(false);
      expect(invalid.errors.chest).toBeDefined();
      expect(invalid.errors.waist).toBeDefined();
    });

    it('converts cm to inches (cm / 2.54, rounded to 0.25) and enforces 20–203 cm', () => {
      const cmResult = validateMeasurements({
        chest: 101.6, // 101.6 / 2.54 = 40 inches
        waist: 76.2   // 76.2 / 2.54 = 30 inches
      }, 'cm');

      expect(cmResult.ok).toBe(true);
      expect(cmResult.inches.chest).toBe(40);
      expect(cmResult.inches.waist).toBe(30);

      const invalidCm = validateMeasurements({ chest: 10, waist: 250 }, 'cm');
      expect(invalidCm.ok).toBe(false);
      expect(invalidCm.errors.chest).toBeDefined();
      expect(invalidCm.errors.waist).toBeDefined();
    });
  });

  describe('formatMeasurement', () => {
    it('formats inches for display with " suffix', () => {
      expect(formatMeasurement(40.5, 'in')).toBe('40.5"');
      expect(formatMeasurement(38, 'inches')).toBe('38"');
    });

    it('formats centimetres for display with rounded integer and cm suffix', () => {
      // 40 inches * 2.54 = 101.6 -> 102 cm
      expect(formatMeasurement(40, 'cm')).toBe('102 cm');
      expect(formatMeasurement(30, 'centimetres')).toBe('76 cm');
    });

    it('handles empty/null values gracefully', () => {
      expect(formatMeasurement(null)).toBe('');
      expect(formatMeasurement('')).toBe('');
      expect(formatMeasurement(undefined)).toBe('');
    });
  });

  describe('ordersForCustomer', () => {
    const customer = { id: 'CUS-10', phone_norm: '+2348031234567' };

    it('matches by customer_id first', () => {
      const orders = [
        { id: 'ORD-1', customer_id: 'CUS-10', customer_phone: '+2349999999999' },
        { id: 'ORD-2', customer_id: 'CUS-99', customer_phone: '+2348031234567' }
      ];
      const matched = ordersForCustomer(customer, orders);
      expect(matched.map((o) => o.id)).toEqual(['ORD-1']);
    });

    it('matches by normalized customer_phone when customer_id is absent', () => {
      const orders = [
        { id: 'ORD-3', customer_phone: '0803 123 4567' },
        { id: 'ORD-4', customer_phone: '+2348090000000' },
        { id: 'ORD-5', customer_phone: '' }
      ];
      const matched = ordersForCustomer(customer, orders);
      expect(matched.map((o) => o.id)).toEqual(['ORD-3']);
    });
  });

  describe('findPossibleDuplicates', () => {
    it('finds other customers with the same non-empty phone_norm', () => {
      const current = { id: 'CUS-1', name: 'Alabi Ade', phone_norm: '+2348031234567' };
      const all = [
        current,
        { id: 'CUS-2', name: 'Adebayo Alabi', phone_norm: '+2348031234567' },
        { id: 'CUS-3', name: 'Other Client', phone_norm: '+2348091112233' },
        { id: 'CUS-4', name: 'No Phone', phone_norm: '' }
      ];

      const duplicates = findPossibleDuplicates(current, all);
      expect(duplicates.length).toBe(1);
      expect(duplicates[0].id).toBe('CUS-2');
    });
  });

  describe('rebuildCustomersFromOrders', () => {
    it('is idempotent: second run returns an empty array', () => {
      const orders = [
        { customer_name: 'Chief Femi Kuti', customer_phone: '+2348022233445', source: 'WhatsApp' },
        { customer_name: 'Dr. Adebayo Alabi', customer_phone: '08031234567', source: 'Site' }
      ];

      const newCustomers = rebuildCustomersFromOrders([], orders, []);
      expect(newCustomers.length).toBe(2);
      expect(newCustomers[0].name).toBe('Chief Femi Kuti');
      expect(newCustomers[0].source).toBe('WhatsApp');
      expect(newCustomers[1].phone_norm).toBe('+2348031234567');

      // Second run passing previously created customers
      const secondRun = rebuildCustomersFromOrders(newCustomers, orders, []);
      expect(secondRun).toEqual([]);
    });

    it('creates two distinct customer records when two different names share a phone', () => {
      const orders = [
        { customer_name: 'Tunde Bakare', customer_phone: '+2348129876543', source: 'Instagram' },
        { customer_name: 'Babatunde Davies', customer_phone: '+2348129876543', source: 'Site' }
      ];

      const created = rebuildCustomersFromOrders([], orders, []);
      expect(created.length).toBe(2);
      expect(created[0].name).toBe('Tunde Bakare');
      expect(created[1].name).toBe('Babatunde Davies');
      expect(created[0].phone_norm).toBe(created[1].phone_norm);

      // Duplicates helper recognizes the shared number
      const dups = findPossibleDuplicates(created[0], created);
      expect(dups.length).toBe(1);
      expect(dups[0].name).toBe('Babatunde Davies');
    });
  });

  describe('escapeHtml', () => {
    it('safely escapes special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml("Tom & Jerry's")).toBe('Tom &amp; Jerry&#039;s');
      expect(escapeHtml(null)).toBe('');
    });
  });
});
