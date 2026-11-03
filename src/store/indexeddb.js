import initialDesigns from '../../data/designs.json';

const DB_NAME = 'apparel_by_ezekiel_db';
const DB_VERSION = 1;

const STORES = ['designs', 'bookings', 'orders', 'expenses', 'subscribers'];

const DEMO_ORDERS = [
  {
    id: 'ORD-1001',
    booking_id: 'BK-201',
    customer_name: 'Dr. Adebayo Alabi',
    customer_phone: '+2348031234567',
    design_title: 'The Imperial Agbada',
    amount: 385000,
    deposit_amount: 192500,
    deposit_status: 'paid',
    status: 'In Progress',
    source: 'Site',
    fitting_date: '2026-11-12',
    notes: 'Chest 44, Length 58. Antique gold embroidery on neck.',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-02T14:30:00Z'
  },
  {
    id: 'ORD-1002',
    booking_id: null,
    customer_name: 'Chief Femi Kuti',
    customer_phone: '+2348022233445',
    design_title: 'The Grandeur Ivory Tuxedo',
    amount: 420000,
    deposit_amount: 210000,
    deposit_status: 'paid',
    status: 'Ready',
    source: 'WhatsApp',
    fitting_date: '2026-11-08',
    notes: 'For State Banquet. Finished with black satin shawl lapel.',
    created_at: '2026-10-28T09:00:00Z',
    updated_at: '2026-11-03T11:00:00Z'
  },
  {
    id: 'ORD-1003',
    booking_id: null,
    customer_name: 'Tunde Bakare',
    customer_phone: '+2348129876543',
    design_title: 'Obsidian Senator Suit',
    amount: 210000,
    deposit_amount: 100000,
    deposit_status: 'paid',
    status: 'Confirmed',
    source: 'Instagram',
    fitting_date: '2026-11-15',
    notes: 'Slim cut with side adjusters.',
    created_at: '2026-11-02T16:20:00Z',
    updated_at: '2026-11-02T16:20:00Z'
  },
  {
    id: 'ORD-1004',
    booking_id: null,
    customer_name: 'Emeka Okonkwo',
    customer_phone: '+2349051112233',
    design_title: 'Royal Velvet Kaftan',
    amount: 260000,
    deposit_amount: 0,
    deposit_status: 'pending',
    status: 'Pending',
    source: 'Walk-in',
    fitting_date: '2026-11-20',
    notes: 'Requested fabric swatch review before cutting.',
    created_at: '2026-11-03T08:15:00Z',
    updated_at: '2026-11-03T08:15:00Z'
  },
  {
    id: 'ORD-1005',
    booking_id: null,
    customer_name: 'Senator Bello',
    customer_phone: '+2348090001122',
    design_title: 'Monarch Brocade Ceremonial Set',
    amount: 340000,
    deposit_amount: 340000,
    deposit_status: 'paid',
    status: 'Delivered',
    source: 'WhatsApp',
    fitting_date: '2026-10-25',
    notes: 'Delivered to Abuja via DHL Courier.',
    created_at: '2026-10-20T12:00:00Z',
    updated_at: '2026-10-27T17:00:00Z'
  }
];

const DEMO_BOOKINGS = [
  {
    id: 'BK-201',
    customer_name: 'Dr. Adebayo Alabi',
    phone: '+2348031234567',
    fitting_date: '2026-11-12',
    design_id: 'imperial-agbada',
    design_title: 'The Imperial Agbada',
    notes: 'Need early morning fitting at 10 AM.',
    deposit_status: 'paid',
    deposit_amount: 50000,
    deposit_reference: 'OPAY-SIM-829104',
    status: 'confirmed',
    created_at: '2026-11-01T09:40:00Z'
  },
  {
    id: 'BK-202',
    customer_name: 'Babatunde Davies',
    phone: '+2348129876543',
    fitting_date: '2026-11-18',
    design_id: 'obsidian-senator',
    design_title: 'Obsidian Senator Suit',
    notes: 'Prefer weekend slot if possible.',
    deposit_status: 'pending',
    deposit_amount: 50000,
    deposit_reference: null,
    status: 'pending',
    created_at: '2026-11-02T14:10:00Z'
  },
  {
    id: 'BK-203',
    customer_name: 'Chidi Eze',
    phone: '+2349051112233',
    fitting_date: '2026-11-21',
    design_id: 'sahara-linen-set',
    design_title: 'Sahara Minimalist Linen Set',
    notes: 'Two sets needed for wedding event in Lagos.',
    deposit_status: 'paid',
    deposit_amount: 50000,
    deposit_reference: 'OPAY-SIM-910423',
    status: 'confirmed',
    created_at: '2026-11-03T07:30:00Z'
  }
];

const DEMO_EXPENSES = [
  {
    id: 'EXP-101',
    amount: 185000,
    category: 'fabric',
    date: '2026-11-01',
    description: '15 yards Swiss cotton damask from Balogun',
    raw_input: '185k damask fabric Balogun 2026-11-01',
    created_at: '2026-11-01T11:00:00Z'
  },
  {
    id: 'EXP-102',
    amount: 24000,
    category: 'thread',
    date: '2026-11-02',
    description: 'Metallic embroidery thread and YKK brass zippers',
    raw_input: 'bought metallic thread and buttons 24k yesterday',
    created_at: '2026-11-02T12:00:00Z'
  },
  {
    id: 'EXP-103',
    amount: 65000,
    category: 'power/fuel',
    date: '2026-11-02',
    description: 'Diesel for atelier generator (50 litres)',
    raw_input: '65k diesel fuel generator',
    created_at: '2026-11-02T15:30:00Z'
  },
  {
    id: 'EXP-104',
    amount: 15000,
    category: 'logistics',
    date: '2026-11-02',
    description: 'Dispatch delivery to Ikoyi & Lekki',
    raw_input: 'dispatch 15,000 yesterday',
    created_at: '2026-11-02T17:00:00Z'
  },
  {
    id: 'EXP-105',
    amount: 120000,
    category: 'staff',
    date: '2026-10-31',
    description: 'Weekly artisan tailoring disbursement',
    raw_input: 'paid tailor staff wage 120k',
    created_at: '2026-10-31T18:00:00Z'
  },
  {
    id: 'EXP-106',
    amount: 45000,
    category: 'packaging',
    date: '2026-10-30',
    description: 'Custom embossed luxury garment carrier bags',
    raw_input: '45k garment packaging bags',
    created_at: '2026-10-30T10:00:00Z'
  }
];

const DEMO_SUBSCRIBERS = [
  { id: 'SUB-1', contact: '+2348098765432', channel: 'whatsapp', created_at: '2026-11-01T08:00:00Z' },
  { id: 'SUB-2', contact: '+2348145556677', channel: 'whatsapp', created_at: '2026-11-02T14:20:00Z' },
  { id: 'SUB-3', contact: 'olumide.luxury@gmail.com', channel: 'email', created_at: '2026-11-03T09:10:00Z' }
];

// In-memory fallback if IndexedDB is unavailable
let memoryStores = null;

function initMemoryFallback() {
  if (!memoryStores) {
    try {
      const saved = localStorage.getItem('apparel_backup_data');
      if (saved) {
        memoryStores = JSON.parse(saved);
        return;
      }
    } catch (e) {
      // ignore
    }
    memoryStores = {
      designs: [...initialDesigns],
      bookings: [...DEMO_BOOKINGS],
      orders: [...DEMO_ORDERS],
      expenses: [...DEMO_EXPENSES],
      subscribers: [...DEMO_SUBSCRIBERS]
    };
  }
}

function persistMemoryFallback() {
  if (typeof localStorage !== 'undefined' && memoryStores) {
    try {
      localStorage.setItem('apparel_backup_data', JSON.stringify(memoryStores));
    } catch (e) {
      // quota or private mode
    }
  }
}

let dbInstance = null;

function openDB() {
  if (typeof indexedDB === 'undefined') {
    initMemoryFallback();
    return Promise.resolve(null);
  }

  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        for (const storeName of STORES) {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        // Seed if empty
        seedIfEmpty(dbInstance).then(() => resolve(dbInstance));
      };

      request.onerror = () => {
        initMemoryFallback();
        resolve(null);
      };
    } catch (e) {
      initMemoryFallback();
      resolve(null);
    }
  });
}

async function seedIfEmpty(db) {
  const designs = await getAllRecords(db, 'designs');
  if (designs.length === 0) {
    const tx = db.transaction(STORES, 'readwrite');
    for (const d of initialDesigns) tx.objectStore('designs').put(d);
    for (const b of DEMO_BOOKINGS) tx.objectStore('bookings').put(b);
    for (const o of DEMO_ORDERS) tx.objectStore('orders').put(o);
    for (const exp of DEMO_EXPENSES) tx.objectStore('expenses').put(exp);
    for (const s of DEMO_SUBSCRIBERS) tx.objectStore('subscribers').put(s);
    return new Promise((res) => {
      tx.oncomplete = () => res(true);
      tx.onerror = () => res(false);
    });
  }
}

function getAllRecords(db, storeName) {
  if (!db) {
    initMemoryFallback();
    return Promise.resolve([...(memoryStores[storeName] || [])]);
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    } catch (err) {
      initMemoryFallback();
      resolve([...(memoryStores[storeName] || [])]);
    }
  });
}

function putRecord(db, storeName, record) {
  if (!db) {
    initMemoryFallback();
    const list = memoryStores[storeName] || [];
    const idx = list.findIndex((item) => item.id === record.id);
    if (idx >= 0) {
      list[idx] = record;
    } else {
      list.push(record);
    }
    memoryStores[storeName] = list;
    persistMemoryFallback();
    return Promise.resolve(record);
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(record);
      req.onsuccess = () => resolve(record);
      req.onerror = () => reject(req.error);
    } catch (e) {
      initMemoryFallback();
      resolve(record);
    }
  });
}

function deleteRecord(db, storeName, id) {
  if (!db) {
    initMemoryFallback();
    const list = memoryStores[storeName] || [];
    memoryStores[storeName] = list.filter((item) => item.id !== id);
    persistMemoryFallback();
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    } catch (e) {
      resolve(true);
    }
  });
}

export const indexedDBAdapter = {
  async init() {
    await openDB();
    return true;
  },

  async getDesigns() {
    const db = await openDB();
    const records = await getAllRecords(db, 'designs');
    return records.length > 0 ? records : initialDesigns;
  },

  async saveDesign(design) {
    const db = await openDB();
    return putRecord(db, 'designs', design);
  },

  async getBookings() {
    const db = await openDB();
    return getAllRecords(db, 'bookings');
  },

  async addBooking(booking) {
    const db = await openDB();
    const record = {
      id: booking.id || `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      deposit_status: booking.deposit_status || 'pending',
      deposit_amount: booking.deposit_amount || 50000,
      status: booking.status || 'pending',
      created_at: new Date().toISOString(),
      ...booking
    };
    return putRecord(db, 'bookings', record);
  },

  async updateBooking(id, updates) {
    const db = await openDB();
    const bookings = await getAllRecords(db, 'bookings');
    const existing = bookings.find((b) => b.id === id);
    if (!existing) throw new Error(`Booking ${id} not found`);
    const updated = { ...existing, ...updates };
    return putRecord(db, 'bookings', updated);
  },

  async getOrders() {
    const db = await openDB();
    const orders = await getAllRecords(db, 'orders');
    return orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  async addOrder(order) {
    const db = await openDB();
    const now = new Date().toISOString();
    const record = {
      id: order.id || `ORD-${Date.now().toString().slice(-6)}`,
      status: order.status || 'Pending',
      source: order.source || 'Site',
      deposit_amount: order.deposit_amount || 0,
      deposit_status: order.deposit_status || 'pending',
      created_at: now,
      updated_at: now,
      ...order
    };
    return putRecord(db, 'orders', record);
  },

  async updateOrder(id, updates) {
    const db = await openDB();
    const orders = await getAllRecords(db, 'orders');
    const existing = orders.find((o) => o.id === id);
    if (!existing) throw new Error(`Order ${id} not found`);
    const updated = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };
    return putRecord(db, 'orders', updated);
  },

  async deleteOrder(id) {
    const db = await openDB();
    return deleteRecord(db, 'orders', id);
  },

  async getExpenses() {
    const db = await openDB();
    const expenses = await getAllRecords(db, 'expenses');
    return expenses.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async addExpense(expense) {
    const db = await openDB();
    const record = {
      id: expense.id || `EXP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
      ...expense
    };
    return putRecord(db, 'expenses', record);
  },

  async deleteExpense(id) {
    const db = await openDB();
    return deleteRecord(db, 'expenses', id);
  },

  async getSubscribers() {
    const db = await openDB();
    return getAllRecords(db, 'subscribers');
  },

  async addSubscriber(contact, channel = 'whatsapp') {
    const db = await openDB();
    const record = {
      id: `SUB-${Date.now()}`,
      contact,
      channel,
      created_at: new Date().toISOString()
    };
    return putRecord(db, 'subscribers', record);
  },

  async exportAll() {
    const db = await openDB();
    const [designs, bookings, orders, expenses, subscribers] = await Promise.all([
      getAllRecords(db, 'designs'),
      getAllRecords(db, 'bookings'),
      getAllRecords(db, 'orders'),
      getAllRecords(db, 'expenses'),
      getAllRecords(db, 'subscribers')
    ]);

    return {
      version: 1,
      appName: 'Apparel by Ezekiel',
      exportedAt: new Date().toISOString(),
      data: {
        designs,
        bookings,
        orders,
        expenses,
        subscribers
      }
    };
  },

  async importAll(imported) {
    if (!imported || !imported.data) {
      throw new Error('Invalid backup file format');
    }
    const db = await openDB();
    const { designs, bookings, orders, expenses, subscribers } = imported.data;

    if (db) {
      const tx = db.transaction(STORES, 'readwrite');
      if (Array.isArray(designs)) for (const d of designs) tx.objectStore('designs').put(d);
      if (Array.isArray(bookings)) for (const b of bookings) tx.objectStore('bookings').put(b);
      if (Array.isArray(orders)) for (const o of orders) tx.objectStore('orders').put(o);
      if (Array.isArray(expenses)) for (const e of expenses) tx.objectStore('expenses').put(e);
      if (Array.isArray(subscribers)) for (const s of subscribers) tx.objectStore('subscribers').put(s);

      return new Promise((res, rej) => {
        tx.oncomplete = () => res(true);
        tx.onerror = () => rej(tx.error);
      });
    } else {
      initMemoryFallback();
      if (Array.isArray(designs)) memoryStores.designs = designs;
      if (Array.isArray(bookings)) memoryStores.bookings = bookings;
      if (Array.isArray(orders)) memoryStores.orders = orders;
      if (Array.isArray(expenses)) memoryStores.expenses = expenses;
      if (Array.isArray(subscribers)) memoryStores.subscribers = subscribers;
      persistMemoryFallback();
      return true;
    }
  },

  async resetToDemo() {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORES, 'readwrite');
      for (const name of STORES) tx.objectStore(name).clear();
      for (const d of initialDesigns) tx.objectStore('designs').put(d);
      for (const b of DEMO_BOOKINGS) tx.objectStore('bookings').put(b);
      for (const o of DEMO_ORDERS) tx.objectStore('orders').put(o);
      for (const exp of DEMO_EXPENSES) tx.objectStore('expenses').put(exp);
      for (const s of DEMO_SUBSCRIBERS) tx.objectStore('subscribers').put(s);

      return new Promise((res) => {
        tx.oncomplete = () => res(true);
        tx.onerror = () => res(false);
      });
    } else {
      memoryStores = {
        designs: [...initialDesigns],
        bookings: [...DEMO_BOOKINGS],
        orders: [...DEMO_ORDERS],
        expenses: [...DEMO_EXPENSES],
        subscribers: [...DEMO_SUBSCRIBERS]
      };
      persistMemoryFallback();
      return true;
    }
  }
};
