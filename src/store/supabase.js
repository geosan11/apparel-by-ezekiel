import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : null;

export const supabaseAdapter = {
  isConfigured: isSupabaseConfigured,

  // Auth helpers
  async signIn(email, password) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  // CRUD helpers
  async getDesigns() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('designs')
      .select('*')
      .order('price', { ascending: false });
    if (error) throw error;
    return data;
  },

  async saveDesign(design) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('designs')
      .upsert(design)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getBookings() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addBooking(booking) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const record = {
      id: booking.id || `BK-${Date.now()}`,
      customer_name: booking.customer_name,
      phone: booking.phone,
      fitting_date: booking.fitting_date,
      design_id: booking.design_id || null,
      design_title: booking.design_title || null,
      notes: booking.notes || '',
      deposit_status: booking.deposit_status || 'pending',
      deposit_amount: booking.deposit_amount || 50000,
      deposit_reference: booking.deposit_reference || null,
      status: booking.status || 'pending'
    };
    const { data, error } = await supabase
      .from('bookings')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateBooking(id, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrders() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addOrder(order) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const record = {
      id: order.id || `ORD-${Date.now().toString().slice(-6)}`,
      customer_id: order.customer_id || null,
      booking_id: order.booking_id || null,
      customer_name: order.customer_name,
      customer_phone: order.customer_phone,
      design_title: order.design_title,
      amount: order.amount,
      deposit_amount: order.deposit_amount || 0,
      deposit_status: order.deposit_status || 'pending',
      status: order.status || 'Pending',
      source: order.source || 'Site',
      fitting_date: order.fitting_date || null,
      notes: order.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('orders')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateOrder(id, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteOrder(id) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getExpenses() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addExpense(expense) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const record = {
      id: expense.id || `EXP-${Date.now()}`,
      amount: expense.amount,
      category: expense.category,
      date: expense.date,
      description: expense.description || '',
      raw_input: expense.raw_input || null
    };
    const { data, error } = await supabase
      .from('expenses')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteExpense(id) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getCustomers() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async addCustomer(customer) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const now = new Date().toISOString();
    const record = {
      id: customer.id || `CUS-${Date.now()}`,
      name: customer.name,
      phone: customer.phone,
      phone_norm: customer.phone_norm || '',
      source: customer.source || 'Site',
      measurements: customer.measurements || null,
      notes: customer.notes || '',
      follow_up: customer.follow_up || null,
      created_at: customer.created_at || now,
      updated_at: customer.updated_at || now
    };
    const { data, error } = await supabase
      .from('customers')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateCustomer(id, updates) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteCustomer(id) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getSubscribers() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async addSubscriber(contact, channel = 'whatsapp') {
    if (!supabase) throw new Error('Supabase is not configured.');
    const record = {
      id: `SUB-${Date.now()}`,
      contact,
      channel,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('subscribers')
      .insert(record)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
};
