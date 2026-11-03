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
});
