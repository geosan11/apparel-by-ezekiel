/**
 * Simple CRM Logic — Pure functions (no DOM, no IndexedDB)
 * Owner's principles: EXTREME SIMPLICITY, PROGRESSIVE DISCLOSURE, ONLY ESSENTIAL FIELDS.
 */

export const STATUS_COLORS = {
  due: '#B89B6A',    // Gold accent
  active: '#F6F3EE', // Off-white
  quiet: '#8A847C'   // Warm grey
};

export const MEASUREMENT_FIELDS = ['chest', 'waist', 'hips', 'shoulder', 'sleeve'];

export const CUSTOMER_SOURCES = ['WhatsApp', 'Instagram', 'Walk-in', 'Site', 'Referral'];

/**
 * Normalizes phone numbers:
 * - strips spaces, dashes, brackets, dots
 * - '0803…' → '+234803…'
 * - '234803…' → '+234803…'
 * - '+234…' unchanged
 * - other international '+' numbers kept
 * - returns '' for empty/garbage
 */
export function normalizePhone(raw) {
  if (!raw || typeof raw !== 'string') return '';
  const cleaned = raw.trim().replace(/[\s\-\(\)\.]/g, '');
  if (!cleaned) return '';

  // Must contain digits
  const digitsOnly = cleaned.replace(/\D/g, '');
  if (digitsOnly.length < 7) return '';

  if (cleaned.startsWith('+234')) {
    return cleaned;
  }
  if (cleaned.startsWith('234')) {
    return '+' + cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+234' + cleaned.slice(1);
  }
  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  return '';
}

/**
 * Matches orders belonging to a customer:
 * - if order.customer_id === customer.id
 * - otherwise (no customer_id) if normalizePhone(order.customer_phone) === customer.phone_norm
 * - orders without a phone stay unlinked
 */
export function ordersForCustomer(customer, orders = []) {
  if (!customer) return [];
  return (orders || []).filter((order) => {
    if (order.customer_id) {
      return order.customer_id === customer.id;
    }
    if (!order.customer_phone || !customer.phone_norm) {
      return false;
    }
    return normalizePhone(order.customer_phone) === customer.phone_norm;
  });
}

/**
 * Derives customer status:
 * - 'due' if follow_up exists, not done, and due <= today
 * - else 'active' if any linked order status is not Delivered/Completed/Cancelled
 * - else 'quiet'
 */
export function deriveStatus(customer, orders = [], today = new Date().toISOString().slice(0, 10)) {
  if (!customer) return 'quiet';

  if (
    customer.follow_up &&
    !customer.follow_up.done_at &&
    customer.follow_up.due &&
    customer.follow_up.due <= today
  ) {
    return 'due';
  }

  const linked = ordersForCustomer(customer, orders);
  const inactiveStatuses = ['delivered', 'completed', 'cancelled'];
  const hasActiveOrder = linked.some((o) => {
    const s = (o.status || '').trim().toLowerCase();
    return s && !inactiveStatuses.includes(s);
  });

  if (hasActiveOrder) {
    return 'active';
  }

  return 'quiet';
}

/**
 * Finds the single undone follow-up with earliest due date <= today
 * Returns null if none due.
 */
export function nextFollowUp(customers = [], today = new Date().toISOString().slice(0, 10)) {
  if (!Array.isArray(customers)) return null;

  const dueList = customers.filter(
    (c) =>
      c &&
      c.follow_up &&
      !c.follow_up.done_at &&
      c.follow_up.due &&
      c.follow_up.due <= today
  );

  if (dueList.length === 0) return null;

  // Earliest due date first
  dueList.sort((a, b) => a.follow_up.due.localeCompare(b.follow_up.due));
  const candidate = dueList[0];

  return {
    ...candidate.follow_up,
    customer: candidate,
    customerId: candidate.id,
    customerName: candidate.name,
    id: candidate.id,
    name: candidate.name,
    phone: candidate.phone,
    phone_norm: candidate.phone_norm,
    follow_up: candidate.follow_up,
    due: candidate.follow_up.due,
    note: candidate.follow_up.note,
    done_at: candidate.follow_up.done_at
  };
}

/**
 * Validates the 5 measurement fields (Chest, Waist, Hips, Shoulder, Sleeve):
 * - each may be blank (null)
 * - positive number in sane range (inches: 8–80, cm: 20–203)
 * - returns { ok, errors, inches } with values converted to inches (cm / 2.54, rounded to 0.25)
 */
export function validateMeasurements(values = {}, unit = 'in') {
  const errors = {};
  const inches = {};
  const isCm = unit === 'cm' || unit === 'centimetres';

  for (const field of MEASUREMENT_FIELDS) {
    const val = values ? values[field] : undefined;

    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      inches[field] = null;
      continue;
    }

    const num = Number(val);
    if (isNaN(num) || num <= 0) {
      errors[field] = 'Must be a positive number';
      inches[field] = null;
      continue;
    }

    if (isCm) {
      if (num < 20 || num > 203) {
        errors[field] = 'Must be between 20 and 203 cm';
        inches[field] = null;
      } else {
        inches[field] = Math.round((num / 2.54) * 4) / 4;
      }
    } else {
      if (num < 8 || num > 80) {
        errors[field] = 'Must be between 8 and 80 inches';
        inches[field] = null;
      } else {
        inches[field] = Math.round(num * 4) / 4;
      }
    }
  }

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    inches
  };
}

/**
 * Formats canonical inches for display
 * in → e.g. 40.5"
 * cm → rounded integer + ' cm'
 */
export function formatMeasurement(inches, unit = 'in') {
  if (inches === null || inches === undefined || inches === '') return '';
  const num = Number(inches);
  if (isNaN(num)) return '';

  if (unit === 'cm' || unit === 'centimetres') {
    return `${Math.round(num * 2.54)} cm`;
  }
  return `${num}"`;
}

/**
 * Finds other customers with the same non-empty phone_norm.
 * NEVER auto-merge (families and agents share numbers); UI shows a subtle hint only.
 */
export function findPossibleDuplicates(customer, customers = []) {
  if (!customer || !customer.phone_norm) return [];
  return (customers || []).filter(
    (c) => c && c.id !== customer.id && c.phone_norm && c.phone_norm === customer.phone_norm
  );
}

/**
 * Pure and idempotent customer builder from orders and bookings.
 * Returns the list of NEW customer records to create.
 * If no existing customer has the same phone_norm AND same name (case-insensitive, trimmed),
 * creates one (source from order.source, else 'Site').
 * Never edits or deletes existing customers.
 * Running it twice yields zero new records the second time.
 * Two different names sharing a phone → two customers.
 */
export function rebuildCustomersFromOrders(existingCustomers = [], orders = [], bookings = []) {
  const newCustomers = [];
  const allKnown = [...(existingCustomers || [])];

  function matches(c, normPhone, trimmedLowerName) {
    const cPhone = c.phone_norm || normalizePhone(c.phone || '');
    const cName = (c.name || '').trim().toLowerCase();
    return cPhone === normPhone && cName === trimmedLowerName;
  }

  const items = [
    ...(orders || []).map((o) => ({
      name: o.customer_name,
      phone: o.customer_phone,
      source: o.source || 'Site',
      created_at: o.created_at,
      updated_at: o.updated_at
    })),
    ...(bookings || []).map((b) => ({
      name: b.customer_name,
      phone: b.phone,
      source: 'Site',
      created_at: b.created_at,
      updated_at: b.created_at
    }))
  ];

  for (const item of items) {
    const rawName = item.name;
    if (!rawName || typeof rawName !== 'string' || !rawName.trim()) {
      continue;
    }
    const trimmedName = rawName.trim();
    const trimmedLower = trimmedName.toLowerCase();
    const rawPhone = item.phone || '';
    const normPhone = normalizePhone(rawPhone);

    const exists = allKnown.some((c) => matches(c, normPhone, trimmedLower));
    if (!exists) {
      const now = new Date().toISOString();
      const newCust = {
        id: `CUS-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: trimmedName,
        phone: rawPhone,
        phone_norm: normPhone,
        source: item.source || 'Site',
        measurements: null,
        notes: '',
        follow_up: null,
        created_at: item.created_at || now,
        updated_at: item.updated_at || item.created_at || now
      };
      newCustomers.push(newCust);
      allKnown.push(newCust);
    }
  }

  return newCustomers;
}

/**
 * Escapes user-entered strings for secure innerHTML injection.
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
