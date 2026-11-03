import { describe, it, expect, beforeEach } from 'vitest';
import { indexedDBAdapter } from '../src/store/indexeddb.js';

describe('IndexedDB Store Adapter (with in-memory fallback)', () => {
  beforeEach(async () => {
    await indexedDBAdapter.resetToDemo();
  });

  it('retrieves initial seeded designs', async () => {
    const designs = await indexedDBAdapter.getDesigns();
    expect(designs.length).toBe(8);
    expect(designs[0].title).toBe('The Imperial Agbada');
  });

  it('adds and updates bookings', async () => {
    const newBooking = await indexedDBAdapter.addBooking({
      customer_name: 'Olumide Bakare',
      phone: '+2348011223344',
      fitting_date: '2026-11-28',
      design_id: 'royal-velvet-kaftan',
      design_title: 'Royal Velvet Kaftan',
      notes: 'Evening fitting slot please.'
    });

    expect(newBooking.id).toBeDefined();
    expect(newBooking.customer_name).toBe('Olumide Bakare');
    expect(newBooking.deposit_status).toBe('pending');

    const updated = await indexedDBAdapter.updateBooking(newBooking.id, {
      deposit_status: 'paid',
      deposit_reference: 'OPAY-TEST-12345'
    });
    expect(updated.deposit_status).toBe('paid');
    expect(updated.deposit_reference).toBe('OPAY-TEST-12345');
  });

  it('performs CRUD operations on orders', async () => {
    const initialOrders = await indexedDBAdapter.getOrders();
    const countBefore = initialOrders.length;

    const order = await indexedDBAdapter.addOrder({
      customer_name: 'Kunle Afolayan',
      customer_phone: '+2348029998877',
      design_title: 'Obsidian Senator Suit',
      amount: 210000,
      source: 'Instagram'
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('Pending');

    const afterAdd = await indexedDBAdapter.getOrders();
    expect(afterAdd.length).toBe(countBefore + 1);

    await indexedDBAdapter.updateOrder(order.id, { status: 'Confirmed', deposit_amount: 105000 });
    const ordersAfterUpdate = await indexedDBAdapter.getOrders();
    const updated = ordersAfterUpdate.find((o) => o.id === order.id);
    expect(updated.status).toBe('Confirmed');
    expect(updated.deposit_amount).toBe(105000);

    await indexedDBAdapter.deleteOrder(order.id);
    const afterDelete = await indexedDBAdapter.getOrders();
    expect(afterDelete.find((o) => o.id === order.id)).toBeUndefined();
  });

  it('adds and deletes expenses', async () => {
    const expenses = await indexedDBAdapter.getExpenses();
    const initialCount = expenses.length;

    const newExpense = await indexedDBAdapter.addExpense({
      amount: 45000,
      category: 'power/fuel',
      date: '2026-11-03',
      description: 'Diesel purchase'
    });

    expect(newExpense.id).toBeDefined();
    const afterAdd = await indexedDBAdapter.getExpenses();
    expect(afterAdd.length).toBe(initialCount + 1);

    await indexedDBAdapter.deleteExpense(newExpense.id);
    const afterDelete = await indexedDBAdapter.getExpenses();
    expect(afterDelete.length).toBe(initialCount);
  });

  it('adds subscribers', async () => {
    await indexedDBAdapter.addSubscriber('+2348077778899', 'whatsapp');
    const subs = await indexedDBAdapter.getSubscribers();
    expect(subs.some((s) => s.contact === '+2348077778899')).toBe(true);
  });

  it('exports and imports backup data', async () => {
    const backup = await indexedDBAdapter.exportAll();
    expect(backup.appName).toBe('Apparel by Ezekiel');
    expect(backup.data.designs.length).toBe(8);
    expect(backup.data.orders.length).toBeGreaterThan(0);

    // Modify a field and import
    backup.data.orders[0].customer_name = 'TEST CUSTOMER BACKUP';
    await indexedDBAdapter.importAll(backup);

    const orders = await indexedDBAdapter.getOrders();
    expect(orders.some((o) => o.customer_name === 'TEST CUSTOMER BACKUP')).toBe(true);
  });

  it('performs CRUD operations on customers via memory fallback', async () => {
    const initialCustomers = await indexedDBAdapter.getCustomers();
    expect(initialCustomers.length).toBeGreaterThanOrEqual(7);

    // Verify seeded demo customers have measurements and follow_up
    const withMeasurements = initialCustomers.find((c) => c.measurements && c.measurements.chest);
    expect(withMeasurements).toBeDefined();
    expect(withMeasurements.measurements.chest).toBe(44);

    const withFollowUp = initialCustomers.find((c) => c.follow_up && c.follow_up.due);
    expect(withFollowUp).toBeDefined();
    expect(withFollowUp.follow_up.due).toBe(new Date().toISOString().slice(0, 10));

    // Add Customer
    const added = await indexedDBAdapter.addCustomer({
      name: 'Adewale Adeleke',
      phone: '0802 345 6789',
      source: 'Referral'
    });
    expect(added.id).toMatch(/^CUS-/);
    expect(added.name).toBe('Adewale Adeleke');
    expect(added.phone_norm).toBe('+2348023456789');
    expect(added.created_at).toBeDefined();
    expect(added.updated_at).toBeDefined();

    const afterAdd = await indexedDBAdapter.getCustomers();
    expect(afterAdd.some((c) => c.id === added.id)).toBe(true);

    // Update Customer
    const updated = await indexedDBAdapter.updateCustomer(added.id, {
      notes: 'Prefers navy and dark emerald fabrics.',
      phone: '+2348029990000'
    });
    expect(updated.notes).toBe('Prefers navy and dark emerald fabrics.');
    expect(updated.phone_norm).toBe('+2348029990000');

    // Delete Customer
    await indexedDBAdapter.deleteCustomer(added.id);
    const afterDelete = await indexedDBAdapter.getCustomers();
    expect(afterDelete.some((c) => c.id === added.id)).toBe(false);
  });

  it('exportAll v2 includes customers and bumps version to 2', async () => {
    const backup = await indexedDBAdapter.exportAll();
    expect(backup.version).toBe(2);
    expect(backup.data.customers).toBeDefined();
    expect(Array.isArray(backup.data.customers)).toBe(true);
    expect(backup.data.customers.length).toBeGreaterThanOrEqual(7);
  });

  it('import of a v1 backup (no customers key) creates customers via rebuild', async () => {
    const v1Backup = {
      version: 1,
      appName: 'Apparel by Ezekiel',
      exportedAt: '2026-10-01T12:00:00Z',
      data: {
        designs: [],
        bookings: [],
        orders: [
          {
            id: 'ORD-V1-01',
            customer_name: 'Senator Kashim',
            customer_phone: '0803 777 8888',
            design_title: 'Imperial Agbada',
            amount: 350000,
            source: 'WhatsApp',
            status: 'In Progress'
          }
        ],
        expenses: [],
        subscribers: []
        // Notice: NO customers key
      }
    };

    await indexedDBAdapter.importAll(v1Backup);
    const customers = await indexedDBAdapter.getCustomers();
    const created = customers.find((c) => c.name === 'Senator Kashim');
    expect(created).toBeDefined();
    expect(created.phone_norm).toBe('+2348037778888');
    expect(created.source).toBe('WhatsApp');
  });

  it('v2 export → reset → import round-trip preserves customers including measurements, notes, and follow_up', async () => {
    // Add custom customer with full fields
    const custom = await indexedDBAdapter.addCustomer({
      name: 'Prince Adeleke',
      phone: '+2348039991122',
      source: 'Walk-in',
      notes: 'VIP customer fitting for royal wedding',
      measurements: {
        chest: 42.5,
        waist: 36,
        hips: 40,
        shoulder: 18.75,
        sleeve: 25.5,
        updated_at: '2026-11-03T12:00:00Z'
      },
      follow_up: {
        due: '2026-11-05',
        note: 'Send embroidery color swatches',
        done_at: null
      }
    });

    // Export v2
    const exportedV2 = await indexedDBAdapter.exportAll();
    expect(exportedV2.version).toBe(2);

    // Reset to demo
    await indexedDBAdapter.resetToDemo();
    let customersAfterReset = await indexedDBAdapter.getCustomers();
    expect(customersAfterReset.some((c) => c.id === custom.id)).toBe(false);

    // Restore from exported v2
    await indexedDBAdapter.importAll(exportedV2);
    const restoredCustomers = await indexedDBAdapter.getCustomers();
    const restored = restoredCustomers.find((c) => c.id === custom.id);

    expect(restored).toBeDefined();
    expect(restored.name).toBe('Prince Adeleke');
    expect(restored.phone_norm).toBe('+2348039991122');
    expect(restored.notes).toBe('VIP customer fitting for royal wedding');
    expect(restored.measurements).toEqual(custom.measurements);
    expect(restored.follow_up).toEqual(custom.follow_up);
  });
});
