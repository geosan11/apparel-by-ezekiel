import { indexedDBAdapter } from './indexeddb.js';
import { supabaseAdapter, isSupabaseConfigured } from './supabase.js';

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

const adapter = {
  get current() {
    return activeMode === 'supabase' && isSupabaseConfigured
      ? supabaseAdapter
      : indexedDBAdapter;
  }
};

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
        await supabaseAdapter.deleteExpense(id);
      } catch (err) {
        console.warn('Supabase deleteExpense failed:', err);
      }
    }
    return indexedDBAdapter.deleteExpense(id);
  },

  async getSubscribers() {
    try {
      if (activeMode === 'supabase') {
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
