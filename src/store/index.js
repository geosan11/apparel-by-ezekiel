import { indexedDBAdapter, onUpgradeBlocked, onVersionChange } from './indexeddb.js';

export { onUpgradeBlocked, onVersionChange };

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let activeMode = isSupabaseConfigured ? 'supabase' : 'indexeddb';

// Force demo mode preference (can be toggled in admin or testing)
if (typeof localStorage !== 'undefined') {
  if (localStorage.getItem('apparel_force_demo') === 'true') {
    activeMode = 'indexeddb';
  }
}

export function getStoreMode() {
  return activeMode;
}

export function setStoreMode(mode) {
  if (mode === 'indexeddb' || (mode === 'supabase' && isSupabaseConfigured)) {
    activeMode = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('apparel_force_demo', mode === 'indexeddb' ? 'true' : 'false');
    }
  }
}

export function isBackendConnected() {
  return isSupabaseConfigured;
}

let memoisedSupabase = null;

async function getSupabase() {
  if (!memoisedSupabase) {
    memoisedSupabase = (await import('./supabase.js')).supabaseAdapter;
  }
  return memoisedSupabase;
}

export const store = {
  isSupabaseConfigured,
  getStoreMode,
  setStoreMode,

  async init() {
    return indexedDBAdapter.init();
  },

  async getDesigns() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        const designs = await supabaseAdapter.getDesigns();
        // sync to indexeddb cache
        for (const d of designs) indexedDBAdapter.saveDesign(d).catch(() => {});
        return designs;
      }
    } catch (err) {
      console.warn('Supabase fetch designs failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getDesigns();
  },

  async saveDesign(design) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.saveDesign(design);
      } catch (err) {
        console.warn('Supabase save design error, saving to IndexedDB:', err);
      }
    }
    return indexedDBAdapter.saveDesign(design);
  },

  async getBookings() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        return await supabaseAdapter.getBookings();
      }
    } catch (err) {
      console.warn('Supabase fetch bookings failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getBookings();
  },

  async addBooking(booking) {
    let result = null;
    if (isSupabaseConfigured) {
      try {
        const supabaseAdapter = await getSupabase();
        result = await supabaseAdapter.addBooking(booking);
      } catch (err) {
        console.warn('Supabase addBooking failed, recording to IndexedDB:', err);
      }
    }
    const local = await indexedDBAdapter.addBooking(booking);
    return result || local;
  },

  async updateBooking(id, updates) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.updateBooking(id, updates);
      } catch (err) {
        console.warn('Supabase updateBooking error:', err);
      }
    }
    return indexedDBAdapter.updateBooking(id, updates);
  },

  async getOrders() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        return await supabaseAdapter.getOrders();
      }
    } catch (err) {
      console.warn('Supabase fetch orders failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getOrders();
  },

  async addOrder(order) {
    let result = null;
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        result = await supabaseAdapter.addOrder(order);
      } catch (err) {
        console.warn('Supabase addOrder failed:', err);
      }
    }
    const local = await indexedDBAdapter.addOrder(order);
    return result || local;
  },

  async updateOrder(id, updates) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.updateOrder(id, updates);
      } catch (err) {
        console.warn('Supabase updateOrder failed:', err);
      }
    }
    return indexedDBAdapter.updateOrder(id, updates);
  },

  async deleteOrder(id) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.deleteOrder(id);
      } catch (err) {
        console.warn('Supabase deleteOrder failed:', err);
      }
    }
    return indexedDBAdapter.deleteOrder(id);
  },

  async getExpenses() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        return await supabaseAdapter.getExpenses();
      }
    } catch (err) {
      console.warn('Supabase fetch expenses failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getExpenses();
  },

  async addExpense(expense) {
    let result = null;
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        result = await supabaseAdapter.addExpense(expense);
      } catch (err) {
        console.warn('Supabase addExpense failed:', err);
      }
    }
    const local = await indexedDBAdapter.addExpense(expense);
    return result || local;
  },

  async deleteExpense(id) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.deleteExpense(id);
      } catch (err) {
        console.warn('Supabase deleteExpense failed:', err);
      }
    }
    return indexedDBAdapter.deleteExpense(id);
  },

  async getCustomers() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        return await supabaseAdapter.getCustomers();
      }
    } catch (err) {
      console.warn('Supabase fetch customers failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getCustomers();
  },

  async addCustomer(customer) {
    let result = null;
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        result = await supabaseAdapter.addCustomer(customer);
      } catch (err) {
        console.warn('Supabase addCustomer failed:', err);
      }
    }
    const local = await indexedDBAdapter.addCustomer(customer);
    return result || local;
  },

  async updateCustomer(id, updates) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.updateCustomer(id, updates);
      } catch (err) {
        console.warn('Supabase updateCustomer failed:', err);
      }
    }
    return indexedDBAdapter.updateCustomer(id, updates);
  },

  async deleteCustomer(id) {
    if (activeMode === 'supabase') {
      try {
        const supabaseAdapter = await getSupabase();
        await supabaseAdapter.deleteCustomer(id);
      } catch (err) {
        console.warn('Supabase deleteCustomer failed:', err);
      }
    }
    return indexedDBAdapter.deleteCustomer(id);
  },

  async getSubscribers() {
    try {
      if (activeMode === 'supabase') {
        const supabaseAdapter = await getSupabase();
        return await supabaseAdapter.getSubscribers();
      }
    } catch (err) {
      console.warn('Supabase fetch subscribers failed, falling back to IndexedDB:', err);
    }
    return indexedDBAdapter.getSubscribers();
  },

  async addSubscriber(contact, channel = 'whatsapp') {
    let result = null;
    if (isSupabaseConfigured) {
      try {
        const supabaseAdapter = await getSupabase();
        result = await supabaseAdapter.addSubscriber(contact, channel);
      } catch (err) {
        console.warn('Supabase addSubscriber failed:', err);
      }
    }
    const local = await indexedDBAdapter.addSubscriber(contact, channel);
    return result || local;
  },

  async exportAll() {
    return indexedDBAdapter.exportAll();
  },

  async importAll(data) {
    return indexedDBAdapter.importAll(data);
  },

  async resetToDemo() {
    return indexedDBAdapter.resetToDemo();
  }
};
